import { QueryTypes } from 'sequelize';
import sequelize from '../configs/database';
import MovimientoCuentaCorrienteCofre from '../models/movimientoCuentaCorrienteCofre.models';
import { IMovimientoCuentaCorrienteCofreService } from '../interfaces/IMovimientoCuentaCorrienteCofre.service';

class MovimientoCuentaCorrienteCofreService implements IMovimientoCuentaCorrienteCofreService {
  
  async getAllMovimientos(): Promise<MovimientoCuentaCorrienteCofre[]> {
    return await MovimientoCuentaCorrienteCofre.findAll();
  }

  async getMovimientoById(id: number): Promise<MovimientoCuentaCorrienteCofre | null> {
    return await MovimientoCuentaCorrienteCofre.findByPk(id);
  }

  async getMovimientosByClienteId(clienteId: number): Promise<MovimientoCuentaCorrienteCofre[]> {
    return await MovimientoCuentaCorrienteCofre.findAll({
      where: { MovimientoCuentaCorrienteCofre_clienteId: clienteId }
    });
  }

  async getMovimientosByFecha(fecha: Date): Promise<MovimientoCuentaCorrienteCofre[]> {
    return await MovimientoCuentaCorrienteCofre.findAll({
      where: { MovimientoCuentaCorrienteCofre_fechaIngreso: fecha }
    });
  }

  async getMovimientoWithPagos(clienteId: number): Promise<any> {
    const movimientos = await MovimientoCuentaCorrienteCofre.findAll({
      where: {
        MovimientoCuentaCorrienteCofre_clienteId: clienteId
      }
    });

    return {
      movimientos,
      pagos: []
    };
  }

  async getResumenBySocioId(socioId: number, limit = 50): Promise<any> {
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 200) : 50;

    const movimientos = await MovimientoCuentaCorrienteCofre.findAll({
      where: {
        MovimientoCuentaCorrienteCofre_clienteId: socioId,
      },
      order: [['MovimientoCuentaCorrienteCofre_fechaIngreso', 'DESC']],
      limit: safeLimit,
    });

    const resumenRows = await sequelize.query(
      `
      SELECT
        COUNT(*) AS cantidad_movimientos,
        SUM(ISNULL(MovimientoCuentaCorrienteCofre_importe, 0)) AS total_importe,
        SUM(ISNULL(MovimientoCuentaCorrienteCofre_importeCobrar, 0)) AS total_importe_cobrar,
        MAX(MovimientoCuentaCorrienteCofre_fechaIngreso) AS ultimo_movimiento
      FROM dbo.MovimientoCuentaCorrienteCofre
      WHERE ISNULL(MovimientoCuentaCorrienteCofre_deleted, 0) = 0
        AND MovimientoCuentaCorrienteCofre_clienteId = :socioId
      `,
      {
        replacements: { socioId },
        type: QueryTypes.SELECT,
      }
    ) as any[];

    const productosCofre = await sequelize.query(
      `
      SELECT
        ProductoCofre_id,
        ProductoCofre_clienteId,
        ProductoCofre_tipo,
        ProductoCofre_descripcion,
        ProductoCofre_importe,
        ProductoCofre_movimiento_cc,
        ProductoCofre_fechaPago
      FROM dbo.ProductoCofre
      WHERE ISNULL(ProductoCofre_deleted, 0) = 0
        AND ProductoCofre_clienteId = :socioId
      ORDER BY ProductoCofre_id DESC
      `,
      {
        replacements: { socioId },
        type: QueryTypes.SELECT,
      }
    );

    const cajasAsignadas = await sequelize.query(
      `
      SELECT
        scs.socio_caja_id,
        scs.socio_id,
        scs.caja_id,
        scs.es_titular,
        scs.fecha_inicio,
        scs.fecha_fin,
        scs.nota,
        c.numero AS caja_numero,
        c.estado AS caja_estado,
        c.ubicacion AS caja_ubicacion,
        t.nombre AS tamano_nombre
      FROM dbo.socio_caja_seguridad scs
      INNER JOIN dbo.caja_seguridad c ON c.caja_id = scs.caja_id
      LEFT JOIN dbo.caja_seguridad_tamano t ON t.tamano_id = c.tamano_id
      WHERE scs.socio_id = :socioId
      ORDER BY scs.socio_caja_id DESC
      `,
      {
        replacements: { socioId },
        type: QueryTypes.SELECT,
      }
    );

    const resumen = resumenRows?.[0] || {
      cantidad_movimientos: 0,
      total_importe: 0,
      total_importe_cobrar: 0,
      ultimo_movimiento: null,
    };

    return {
      socioId,
      resumen,
      movimientos,
      productosCofre,
      cajasAsignadas,
    };
  }
}

export default MovimientoCuentaCorrienteCofreService;
