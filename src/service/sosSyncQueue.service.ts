// Scaffold para productor de cola (Service Bus) desde el backend.
// TODO: instalar `@azure/service-bus` y conectar en login/selección de socio.

export type SosSyncJob = {
  socioId: number;
  cuit: string;
  fechaDesde?: string;
  fechaHasta?: string;
  requestedAt?: string;
};

class SosSyncQueueService {
  async enqueue(job: SosSyncJob): Promise<void> {
    // Placeholder intencional para no romper runtime actual.
    // Implementación sugerida:
    // 1) const sb = new ServiceBusClient(process.env.SERVICE_BUS_CONNECTION!)
    // 2) const sender = sb.createSender(process.env.SOS_SYNC_QUEUE_NAME || 'sos-sync-queue')
    // 3) await sender.sendMessages({ body: { jobType: 'sync_sos_movimientos', ...job }})
    // 4) close sender/client
    console.log('[sosSyncQueue] enqueue pending implementation', job);
  }
}

export default new SosSyncQueueService();
