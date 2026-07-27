import SosMovimiento from '../models/sosMovimiento.models';
import PagosSocios from '../models/pagosSocios.models';
import logger from '../configs/logger';

class DeudaService {
  async getDeudaSociosById(id: number, cuit?: string): Promise<number> {
    try {
      const cleanCuit = String(cuit || '').replace(/\D/g, '');
      const cuitCondition = cleanCuit ? `AND cuit_cuil = '${cleanCuit}'` : '';

      const result = await SosMovimiento.sequelize?.query(`
        SELECT ISNULL(SUM(ISNULL(montodebe, 0)) - SUM(ISNULL(montohaber, 0)), 0) as total_deuda
        FROM dbo.sos_movimientos
        WHERE socio_id = ${id} AND deleted = 0 ${cuitCondition}
      `, { type: 'SELECT' });

      if (result && result.length > 0) {
        return Number(Number((result[0] as any)?.total_deuda || 0).toFixed(2));
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
          const fallbackResult = await SosMovimiento.sequelize?.query(`
            SELECT ISNULL(SUM(ISNULL(monto, 0)), 0) as total_deuda
            FROM dbo.sos_movimientos
            WHERE socio_id = ${id} AND deleted = 0
          `, { type: 'SELECT' });

          if (fallbackResult && fallbackResult.length > 0) {
            return Number(Number((fallbackResult[0] as any)?.total_deuda || 0).toFixed(2));
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
