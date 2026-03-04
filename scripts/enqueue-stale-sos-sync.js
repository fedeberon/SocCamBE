#!/usr/bin/env node
/* eslint-disable no-console */
const { QueueServiceClient } = require('@azure/storage-queue');
const sequelize = require('../dist/configs/database').default;

const STALE_MINUTES = Number(process.env.SOS_SYNC_STALE_MINUTES || 30);
const BATCH_SIZE = Number(process.env.SOS_SYNC_BATCH_SIZE || 100);
const QUEUE_NAME = process.env.AZURE_QUEUE_NAME || 'incoming-messages';
const CONNECTION_STRING =
  process.env.AZURE_QUEUE_STORAGE_CONNECTION ||
  process.env.AZURE_BLOB_STORAGE_CONNECTION ||
  process.env.AZURE_STORAGE_CONNECTION;

function sanitizeCuit(value) {
  return String(value || '').replace(/\D/g, '');
}

async function run() {
  if (!CONNECTION_STRING) {
    throw new Error('Falta AZURE_QUEUE_STORAGE_CONNECTION');
  }

  const serviceClient = QueueServiceClient.fromConnectionString(CONNECTION_STRING);
  const queueClient = serviceClient.getQueueClient(QUEUE_NAME);
  await queueClient.createIfNotExists();

  await sequelize.authenticate();

  const query = `
    SELECT TOP (:batchSize)
      s.socio_id,
      s.socio_cuit,
      MAX(sm.updated_at) AS last_sync_at
    FROM dbo.socio s
    LEFT JOIN dbo.sos_movimientos sm
      ON sm.socio_id = s.socio_id
      AND sm.deleted = 0
    WHERE ISNULL(s.socio_deleted, 0) = 0
      AND LEN(REPLACE(REPLACE(REPLACE(ISNULL(s.socio_cuit, ''), '-', ''), '.', ''), ' ', '')) >= 11
    GROUP BY s.socio_id, s.socio_cuit
    HAVING MAX(sm.updated_at) IS NULL
       OR MAX(sm.updated_at) < DATEADD(MINUTE, -:staleMinutes, GETDATE())
    ORDER BY MAX(sm.updated_at) ASC
  `;

  const [rows] = await sequelize.query(query, {
    replacements: { staleMinutes: STALE_MINUTES, batchSize: BATCH_SIZE },
  });

  const socios = Array.isArray(rows) ? rows : [];
  let enqueued = 0;

  for (const row of socios) {
    const socioId = Number(row.socio_id);
    const cuit = sanitizeCuit(row.socio_cuit);
    if (!socioId || cuit.length !== 11) continue;

    const payload = {
      jobType: 'sync_sos_movimientos',
      socioId,
      cuit,
      periodo: 'mes',
      trigger: 'auto',
      traceId: `cron-${socioId}-${Date.now()}`,
    };

    await queueClient.sendMessage(JSON.stringify(payload));
    enqueued += 1;
  }

  console.log(`[cron-sync] staleMinutes=${STALE_MINUTES} batchSize=${BATCH_SIZE} queued=${enqueued}`);
  await sequelize.close();
}

run().catch(async (err) => {
  console.error('[cron-sync] error:', err?.message || err);
  try {
    await sequelize.close();
  } catch (_) {}
  process.exit(1);
});
