import 'dotenv/config';
import { QueueServiceClient } from '@azure/storage-queue';
import logger from '../configs/logger';
import sequelize from '../configs/database';
import sosContadorService from '../service/sosContador.service';
import PagosSociosAdapter from '../adapters/PagosSociosAdapter';
import sosMovimientosService from '../service/sosMovimientos.service';

type QueueJob = {
  jobType?: string;
  socioId: number;
  cuit: string;
  periodo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  trigger?: string;
  traceId?: string;
};

function getQueueClient() {
  const connectionString = process.env.AZURE_QUEUE_STORAGE_CONNECTION || process.env.AZURE_BLOB_STORAGE_CONNECTION || process.env.AZURE_STORAGE_CONNECTION;
  const queueName = process.env.AZURE_QUEUE_NAME || 'incoming-messages';

  if (!connectionString) {
    throw new Error('Falta AZURE_QUEUE_STORAGE_CONNECTION');
  }

  const serviceClient = QueueServiceClient.fromConnectionString(connectionString);
  return { queueClient: serviceClient.getQueueClient(queueName), queueName };
}

async function processJob(job: QueueJob) {
  const socioId = Number(job.socioId);
  const cuit = String(job.cuit || '').replace(/\D/g, '');
  const periodo = job.periodo || 'mes';

  if (!socioId || !cuit) {
    throw new Error('Job inválido: socioId/cuit requeridos');
  }

  const cobros = await sosContadorService.getCobrosBySocioCuit({
    socioCuit: cuit,
    periodo,
  });

  const pagosSos = PagosSociosAdapter.fromSosCobros(cobros as any[], socioId, periodo);
  await sosMovimientosService.upsertFromPagosSos(socioId, pagosSos as any[], periodo);

  logger.info(`[sosQueueWorker] sync OK socioId=${socioId} cuit=${cuit} pagos=${pagosSos.length}`);
}

async function runOnce() {
  const { queueClient, queueName } = getQueueClient();
  await queueClient.createIfNotExists();

  const received = await queueClient.receiveMessages({ numberOfMessages: 5, visibilityTimeout: 60 });
  const items = received.receivedMessageItems || [];

  if (items.length === 0) {
    logger.info(`[sosQueueWorker] sin mensajes en ${queueName}`);
    return;
  }

  for (const msg of items) {
    try {
      const raw = msg.messageText ? Buffer.from(msg.messageText, 'base64').toString('utf8') : '{}';
      const job = JSON.parse(raw) as QueueJob;

      if (job.jobType && job.jobType !== 'sync_sos_movimientos') {
        logger.info(`[sosQueueWorker] jobType ignorado: ${job.jobType}`);
      } else {
        await processJob(job);
      }

      await queueClient.deleteMessage(msg.messageId!, msg.popReceipt!);
      logger.info(`[sosQueueWorker] mensaje procesado y eliminado: ${msg.messageId}`);
    } catch (error) {
      logger.error('[sosQueueWorker] error procesando mensaje:', error);
      // no delete => reintento por visibilidad timeout
    }
  }
}

async function main() {
  const mode = process.env.SOS_QUEUE_WORKER_MODE || 'once'; // once | loop
  const sleepMs = Number(process.env.SOS_QUEUE_WORKER_POLL_MS || 15000);

  await sequelize.authenticate();

  if (mode === 'loop') {
    logger.info(`[sosQueueWorker] iniciando loop (poll=${sleepMs}ms)`);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await runOnce();
      await new Promise((r) => setTimeout(r, sleepMs));
    }
  }

  await runOnce();
  await sequelize.close();
}

main().catch(async (err) => {
  logger.error('[sosQueueWorker] fatal:', err);
  try {
    await sequelize.close();
  } catch (_) {
    // noop
  }
  process.exit(1);
});
