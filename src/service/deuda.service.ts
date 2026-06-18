import SosMovimiento from '../models/sosMovimiento.models';
import PagosSocios from '../models/pagosSocios.models';
import logger from '../configs/logger';

class DeudaService {
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
        attributes: ['montodebe', 'montohaber'],
        raw: true,
      } as any);

      const total = rows.reduce((acc: number, r: any) => {
        const debe = Number(r?.montodebe || 0);
        const haber = Number(r?.montohaber || 0);
        return acc + debe - haber;
      }, 0);

      if (rows.length > 0) {
        return Math.max(0, Number(total.toFixed(2)));
      }
    } catch (error: any) {
      const message = String(error?.message || '');
      const isMissingLegacyColumns =
        message.includes('Invalid column name') &&
        (message.includes('montodebe') || message.includes('montohaber'));

      if (!isMissingLegacyColumns) {
        logger.warn('[deudaService] error consultando sos_movimientos, usando fallback', error);
      } else {
        logger.warn('[deudaService] columnas montodebe/montohaber no existen; usando fallback con monto');
        try {
          const rows = await SosMovimiento.findAll({
            where: { socio_id: id, deleted: false },
            attributes: ['monto'],
            raw: true,
          } as any);
          if (rows.length > 0) {
            const total = rows.reduce((acc: number, r: any) => acc + Number(r?.monto || 0), 0);
            return Number(total.toFixed(2));
          }
        } catch (_) {}
      }
    }

    const pagos = await PagosSocios.findAll({
      where: { pagosSocios_socio: id, pagosSocios_deleted: false },
      attributes: ['pagosSocios_monto', 'pagosSocios_estado'],
      raw: true,
    } as any);

    if (pagos.length > 0) {
      const total = pagos.reduce((acc: number, r: any) => {
        if (String(r.pagosSocios_estado || '').toLowerCase() !== 'pagado') {
          return acc + Number(r.pagosSocios_monto || 0);
        }
        return acc;
      }, 0);
      return Number(total.toFixed(2));
    }

    return 0;
  }
}

export default new DeudaService();
