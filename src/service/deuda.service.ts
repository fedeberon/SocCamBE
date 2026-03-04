import SosMovimiento from '../models/sosMovimiento.models';
import logger from '../configs/logger';

class DeudaService {
  async getDeudaSociosById(id: number): Promise<number> {
    try {
      const rows = await SosMovimiento.findAll({
        where: {
          socio_id: id,
          deleted: false,
        },
        attributes: ['montodebe', 'montohaber'],
        raw: true,
      } as any);

      const debe = rows.reduce((acc: number, r: any) => acc + Number(r?.montodebe || 0), 0);
      const haber = rows.reduce((acc: number, r: any) => acc + Number(r?.montohaber || 0), 0);

      return Number((debe - haber).toFixed(2));
    } catch (error: any) {
      const message = String(error?.message || '');
      const isMissingLegacyColumns =
        message.includes('Invalid column name') &&
        (message.includes('montodebe') || message.includes('montohaber'));

      if (!isMissingLegacyColumns) {
        throw error;
      }

      logger.warn('[deudaService] columnas montodebe/montohaber no existen; usando fallback con monto');

      const rows = await SosMovimiento.findAll({
        where: {
          socio_id: id,
          deleted: false,
        },
        attributes: ['monto'],
        raw: true,
      } as any);

      const total = rows.reduce((acc: number, r: any) => acc + Number(r?.monto || 0), 0);
      return Number(total.toFixed(2));
    }
  }
}

export default new DeudaService();
