import SosMovimiento from '../models/sosMovimiento.models';
import logger from '../configs/logger';

class DeudaService {
  private getMontosaldoFromRaw(rawJson: any): number | null {
    try {
      const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
      const saldo = Number(parsed?.montosaldo);
      return Number.isFinite(saldo) ? saldo : null;
    } catch {
      return null;
    }
  }

  async getDeudaSociosById(id: number, cuit?: string): Promise<number> {
    try {
      const where: any = {
        socio_id: id,
        deleted: false,
      };
      const cleanCuit = String(cuit || '').replace(/\D/g, '');
      if (cleanCuit) {
        where.cuit_cuil = cleanCuit;
      }

      const rows = await SosMovimiento.findAll({
        where,
        attributes: ['montodebe', 'montohaber', 'raw_json'],
        raw: true,
      } as any);

      const total = rows.reduce((acc: number, r: any) => {
        const saldo = this.getMontosaldoFromRaw(r?.raw_json);
        if (saldo !== null) {
          return acc + Math.max(0, saldo);
        }

        const debe = Number(r?.montodebe || 0);
        const haber = Number(r?.montohaber || 0);
        return acc + Math.max(0, debe - haber);
      }, 0);

      return Number(total.toFixed(2));
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
