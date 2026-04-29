import { Op, fn, col, literal, Sequelize, QueryTypes } from 'sequelize';
import CajaSeguridad from '../models/CajaSeguridad.models';
import CajaSeguridadTamano from '../models/CajaSeguridadTamano.models';
import SocioCajaSeguridad from '../models/SocioCajaSeguridad.models';

import sequelize from '../configs/database';
import deudaService from './deuda.service';

class DashboardService {
  async resumenInicioSocio(socioId: number) {
    const sid = Number(socioId);
    if (!Number.isFinite(sid) || sid <= 0) {
      return {
        socioId: sid,
        deudaTotal: 0,
        puntosTotal: 0,
        cuponesAsignados: 0,
        misCupones: [],
      };
    }

    const [deudaTotal, puntosRow, cuponesCountRow, misCuponesRows] = await Promise.all([
      deudaService.getDeudaSociosById(sid),
      sequelize.query(
        `
          SELECT ISNULL(SUM(CAST(puntos AS INT)), 0) AS puntosTotal
          FROM dbo.socio_puntos
          WHERE socio_id = :socioId
        `,
        { replacements: { socioId: sid }, type: QueryTypes.SELECT },
      ),
      sequelize.query(
        `
          SELECT COUNT(*) AS total
          FROM dbo.asignar_cupon ac
          INNER JOIN dbo.cupones c ON c.id = ac.cupon_id
          WHERE ac.socio_id = :socioId
            AND ISNULL(c.deleted, 0) = 0
        `,
        { replacements: { socioId: sid }, type: QueryTypes.SELECT },
      ),
      sequelize.query(
        `
          SELECT TOP 10
            c.id,
            c.comercio,
            c.descripcion,
            c.descuento,
            c.fechaExpiracion,
            c.codigo,
            c.utilizado
          FROM dbo.asignar_cupon ac
          INNER JOIN dbo.cupones c ON c.id = ac.cupon_id
          WHERE ac.socio_id = :socioId
            AND ISNULL(c.deleted, 0) = 0
          ORDER BY c.id DESC
        `,
        { replacements: { socioId: sid }, type: QueryTypes.SELECT },
      ),
    ]);

    return {
      socioId: sid,
      deudaTotal: Number(deudaTotal || 0),
      puntosTotal: Number((puntosRow[0] as any)?.puntosTotal || 0),
      cuponesAsignados: Number((cuponesCountRow[0] as any)?.total || 0),
      misCupones: Array.isArray(misCuponesRows) ? misCuponesRows : [],
    };
  }

  async resumenSocios() {
    const total = await sequelize.query(
      `SELECT COUNT(*) AS total FROM dbo.socio WHERE ISNULL(socio_deleted, 0) = 0`,
      { type: QueryTypes.SELECT },
    );
    const totalSocios = Number((total[0] as any)?.total || 0);
    return { total: totalSocios };
  }

  async sociosPorCategoria() {
    const rows = await sequelize.query(
      `
        SELECT 
          ISNULL(ts.tipoSocio_nombre, 'Sin categoría') AS categoria,
          COUNT(*) AS total
        FROM dbo.socio s
        LEFT JOIN dbo.tipoSocio ts ON ts.tipoSocio_id = s.socio_tipoSocio
        WHERE ISNULL(s.socio_deleted, 0) = 0
        GROUP BY ISNULL(ts.tipoSocio_nombre, 'Sin categoría')
        ORDER BY total DESC
      `,
      { type: QueryTypes.SELECT },
    );

    return rows.map((r: any) => ({
      categoria: r.categoria,
      total: Number(r.total) || 0,
    }));
  }

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
    const row = await sequelize.query(
      `
        SELECT
          ISNULL(SUM(CASE WHEN tipo_movimiento = 'FACTURA' THEN ISNULL(montodebe, ISNULL(monto, 0)) ELSE 0 END), 0) AS total_facturado,
          ISNULL(SUM(CASE WHEN tipo_movimiento = 'RECIBO' THEN ISNULL(montohaber, ISNULL(monto, 0)) ELSE 0 END), 0) AS total_cobrado
        FROM dbo.sos_movimientos
        WHERE deleted = 0
          AND (:anio IS NULL OR YEAR(fecha) = :anio)
          AND (:periodo IS NULL OR MONTH(fecha) = :periodo)
      `,
      { replacements: { anio: anio ?? null, periodo: periodo ?? null }, type: QueryTypes.SELECT },
    );

    const total = Number((row[0] as any)?.total_facturado || 0);
    const cobrado = Number((row[0] as any)?.total_cobrado || 0);
    const deuda = Math.max(0, Number((total - cobrado).toFixed(2)));

    return { totalImporte: total, deudaImporte: deuda, deudaPorciento: total > 0 ? Number(((deuda / total) * 100).toFixed(2)) : 0, filtros: { anio, periodo } };
  }

  async deudaPorMes(anio: number) {
    const rows = await sequelize.query(
      `
        SELECT
          YEAR(fecha) AS anio,
          MONTH(fecha) AS periodo,
          ISNULL(SUM(CASE WHEN tipo_movimiento = 'FACTURA' THEN ISNULL(montodebe, ISNULL(monto, 0)) ELSE 0 END), 0) AS total_facturado,
          ISNULL(SUM(CASE WHEN tipo_movimiento = 'RECIBO' THEN ISNULL(montohaber, ISNULL(monto, 0)) ELSE 0 END), 0) AS total_cobrado
        FROM dbo.sos_movimientos
        WHERE deleted = 0
          AND YEAR(fecha) = :anio
        GROUP BY YEAR(fecha), MONTH(fecha)
        ORDER BY MONTH(fecha) ASC
      `,
      { replacements: { anio }, type: QueryTypes.SELECT },
    );

    return (rows as any[]).map((r: any) => {
      const total = Number(r.total_facturado || 0);
      const cobrado = Number(r.total_cobrado || 0);
      const deuda = Math.max(0, Number((total - cobrado).toFixed(2)));
      return { anio: Number(r.anio), periodo: Number(r.periodo), totalImporte: total, deudaImporte: deuda, deudaPorciento: total > 0 ? Number(((deuda / total) * 100).toFixed(2)) : 0 };
    });
  }

  async pagoVsImpagoPorMes(anio: number) {
    const rows = await sequelize.query(
      `
        SELECT
          MONTH(fecha) AS periodo,
          ISNULL(SUM(CASE WHEN tipo_movimiento = 'FACTURA' THEN ISNULL(montodebe, ISNULL(monto, 0)) ELSE 0 END), 0) AS total_facturado,
          ISNULL(SUM(CASE WHEN tipo_movimiento = 'RECIBO' THEN ISNULL(montohaber, ISNULL(monto, 0)) ELSE 0 END), 0) AS total_cobrado
        FROM dbo.sos_movimientos
        WHERE deleted = 0
          AND YEAR(fecha) = :anio
        GROUP BY MONTH(fecha)
        ORDER BY MONTH(fecha) ASC
      `,
      { replacements: { anio }, type: QueryTypes.SELECT },
    );

    return (rows as any[]).map((r: any) => {
      const facturado = Number(r.total_facturado || 0);
      const cobrado = Number(r.total_cobrado || 0);
      const pagado = Math.min(facturado, cobrado);
      const impago = Math.max(0, facturado - cobrado);
      const total = pagado + impago;
      return { periodo: Number(r.periodo), pagado, impago, pagadoPorciento: total > 0 ? Number(((pagado / total) * 100).toFixed(2)) : 0, impagoPorciento: total > 0 ? Number(((impago / total) * 100).toFixed(2)) : 0 };
    });
  }

  async totalRecaudado() {
    const row = await sequelize.query(
      `
        SELECT ISNULL(SUM(CASE WHEN tipo_movimiento = 'RECIBO' THEN ISNULL(montohaber, ISNULL(monto, 0)) ELSE 0 END), 0) AS total
        FROM dbo.sos_movimientos
        WHERE deleted = 0
      `,
      { type: QueryTypes.SELECT },
    );

    const total = Number((row[0] as any)?.total || 0);
    return { total };
  }
}

export default new DashboardService();
