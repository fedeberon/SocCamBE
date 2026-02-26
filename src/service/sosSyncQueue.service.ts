import { QueueClient, QueueServiceClient } from '@azure/storage-queue';
import logger from '../configs/logger';

export type SosSyncJob = {
  socioId: number;
  cuit: string;
  fechaDesde?: string;
  fechaHasta?: string;
  requestedAt?: string;
  traceId?: string;
  trigger?: 'login' | 'manual' | 'auto';
};

class SosSyncQueueService {
  private readonly connectionString = process.env.AZURE_QUEUE_STORAGE_CONNECTION || process.env.AZURE_BLOB_STORAGE_CONNECTION || process.env.AZURE_STORAGE_CONNECTION;
  private readonly queueName = process.env.AZURE_QUEUE_NAME || 'incoming-messages';

  private getClient(): QueueClient {
    if (!this.connectionString) {
      throw new Error('Falta AZURE_QUEUE_STORAGE_CONNECTION (o fallback AZURE_BLOB_STORAGE_CONNECTION / AZURE_STORAGE_CONNECTION)');
    }

    const serviceClient = QueueServiceClient.fromConnectionString(this.connectionString);
    return serviceClient.getQueueClient(this.queueName);
  }

  async enqueue(job: SosSyncJob): Promise<void> {
    const client = this.getClient();
    await client.createIfNotExists();

    const payload = {
      jobType: 'sync_sos_movimientos',
      requestedAt: new Date().toISOString(),
      traceId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...job,
    };

    const body = JSON.stringify(payload);
    const encoded = Buffer.from(body, 'utf8').toString('base64');

    await client.sendMessage(encoded);
    logger.info(`[sosSyncQueue] job encolado en ${this.queueName} (socioId=${job.socioId})`);
  }
}

export default new SosSyncQueueService();
