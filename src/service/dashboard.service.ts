import { Op, fn, col, literal, Sequelize, QueryTypes } from 'sequelize';
import CajaSeguridad from '../models/CajaSeguridad.models';
import CajaSeguridadTamano from '../models/CajaSeguridadTamano.models';
import SocioCajaSeguridad from '../models/SocioCajaSeguridad.models';
import PagosSocios from '../models/pagosSocios.models';
import sequelize from '../configs/database';

class DashboardService {
  async resumenCajas() {
    const total = await CajaSeguridad.count({ where: { deleted: false } });

    const ocupadas = await SocioCajaSeguridad.count({
      distinct: true,
      col: 'caja_id',
      where: { fecha_fin: { [Op.is]: null } },
    });

    return {
      total,
      ocupadas,
      disponibles: Math.max(total - ocupadas, 0),
      ocupacionPorciento: total > 0 ? Number(((ocupadas / total) * 100).toFixed(2)) : 0,
    };
  }

  async ocupacionPorTamano() {
    const rows = await sequelize.query(
      `
        SELECT 
          c.tamano_id,
          t.nombre AS tamano_nombre,
          COUNT(*) AS total_cajas,
          SUM(CASE WHEN scs.caja_id IS NOT NULL AND scs.fecha_fin IS NULL THEN 1 ELSE 0 END) AS ocupadas
        FROM dbo.caja_seguridad c
        LEFT JOIN dbo.socio_caja_seguridad scs
          ON scs.caja_id = c.caja_id
        LEFT JOIN dbo.caja_seguridad_tamano t
          ON t.tamano_id = c.tamano_id
        WHERE c.deleted = 0
        GROUP BY c.tamano_id, t.nombre
      `,
      { type: QueryTypes.SELECT },
    );

    return rows.map((r: any) => {
      const total = Number(r.total_cajas) || 0;
      const ocupadas = Number(r.ocupadas) || 0;
      return {
        tamanoId: r.tamano_id,
        tamanoNombre: r.tamano_nombre,
        total,
        ocupadas,
        disponibles: Math.max(total - ocupadas, 0),
        ocupacionPorciento: total > 0 ? Number(((ocupadas / total) * 100).toFixed(2)) : 0,
      };
    });
  }

  async porcentajeDeuda({ anio, periodo }: { anio?: number; periodo?: number }) {
    const where: any = {};
    if (anio) where.pagosSocios_anio = anio;
    if (periodo) where.pagosSocios_periodo = periodo;
    where.pagosSocios_deleted = { [Op.or]: [false, null] };

    const estadoNoPagado = Sequelize.where(
      Sequelize.cast(col('pagosSocios_estado'), 'NVARCHAR'),
      { [Op.notIn]: ['pagado', 'PAGADO', 'PAGO'] },
    );

    const total = Number(await PagosSocios.sum('pagosSocios_monto', { where })) || 0;

    const deuda = Number(
      await PagosSocios.sum('pagosSocios_monto', {
        where: {
          ...where,
          [Op.and]: [estadoNoPagado],
        },
      }),
    ) || 0;

    return {
      totalImporte: total,
      deudaImporte: deuda,
      deudaPorciento: total > 0 ? Number(((deuda / total) * 100).toFixed(2)) : 0,
      filtros: { anio, periodo },
    };
  }

  async deudaPorMes(anio: number) {
    const estadoNoPagado = Sequelize.where(
      Sequelize.cast(col('pagosSocios_estado'), 'NVARCHAR'),
      { [Op.notIn]: ['pagado', 'PAGADO', 'PAGO'] },
    );

    const rows = await PagosSocios.findAll({
      attributes: [
        'pagosSocios_anio',
        'pagosSocios_periodo',
        [fn('SUM', col('pagosSocios_monto')), 'total'],
        [
          fn(
            'SUM',
            literal(
              `CASE WHEN CAST(pagosSocios_estado AS NVARCHAR(50)) NOT IN ('pagado','PAGADO','PAGO') THEN pagosSocios_monto ELSE 0 END`,
            ),
          ),
          'deuda',
        ],
      ],
      where: {
        pagosSocios_anio: anio,
        pagosSocios_deleted: { [Op.or]: [false, null] },
      },
      group: ['pagosSocios_anio', 'pagosSocios_periodo'],
      order: [[col('pagosSocios_periodo'), 'ASC']],
      raw: true,
    });

    return rows.map((r: any) => {
      const total = Number(r.total) || 0;
      const deuda = Number(r.deuda) || 0;
      return {
        anio: r.pagosSocios_anio,
        periodo: r.pagosSocios_periodo,
        totalImporte: total,
        deudaImporte: deuda,
        deudaPorciento: total > 0 ? Number(((deuda / total) * 100).toFixed(2)) : 0,
      };
    });
  }
}

export default new DashboardService();
