import { Op, QueryTypes } from 'sequelize';
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

    // Unificación AUTO + LEGACY:
    // - AUTO: movimientos con clienteId = socioId
    // - LEGACY: movimientos con clienteId = contratoCofres_id de ese socio
    const contratos = await sequelize.query(
      `
      SELECT contratoCofres_id
      FROM dbo.contratoCofres
      WHERE contratoCofres_esSocioId = :socioId
      `,
      {
        replacements: { socioId },
        type: QueryTypes.SELECT,
      }
    ) as Array<{ contratoCofres_id: number }>;

    const contratoIds = (contratos || [])
      .map((c) => Number(c.contratoCofres_id))
      .filter((id) => Number.isFinite(id));

    const clienteIds = Array.from(new Set([Number(socioId), ...contratoIds]));

    const movimientos = await MovimientoCuentaCorrienteCofre.findAll({
      where: {
        MovimientoCuentaCorrienteCofre_clienteId: { [Op.in]: clienteIds },
        MovimientoCuentaCorrienteCofre_deleted: false,
      },
      order: [['MovimientoCuentaCorrienteCofre_fechaIngreso', 'DESC']],
      limit: safeLimit,
    });

    const movimientosConOrigen = movimientos.map((mov: any) => {
      const json = typeof mov?.toJSON === 'function' ? mov.toJSON() : mov;
      const clienteId = Number(json?.MovimientoCuentaCorrienteCofre_clienteId);
      return {
        ...json,
        mirrorSource: clienteId === Number(socioId) ? 'auto' : 'legacy',
      };
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
        AND MovimientoCuentaCorrienteCofre_clienteId IN (:clienteIds)
      `,
      {
        replacements: { clienteIds },
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
        AND ProductoCofre_clienteId IN (:clienteIds)
      ORDER BY ProductoCofre_id DESC
      `,
      {
        replacements: { clienteIds },
        type: QueryTypes.SELECT,
      }
    );

    const cajasAsignadas = await sequelize.query(
      `
      -- AUTO (modelo nuevo)
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
        t.nombre AS tamano_nombre,
        CAST('auto' AS VARCHAR(16)) AS origen,
        CAST(NULL AS INT) AS contrato_id,
        CAST(NULL AS INT) AS contrato_numero,
        CAST(NULL AS VARCHAR(32)) AS contrato_estado,
        CAST(NULL AS VARCHAR(32)) AS contrato_modalidad,
        CAST(
          CASE
            WHEN c.ubicacion IS NOT NULL
              AND PATINDEX('[A-Za-z]%', LTRIM(RTRIM(CAST(c.ubicacion AS VARCHAR(64))))) = 1
              THEN LEFT(LTRIM(RTRIM(CAST(c.ubicacion AS VARCHAR(64)))), 1)
            WHEN c.numero IS NOT NULL
              AND PATINDEX('[A-Za-z]%', LTRIM(RTRIM(CAST(c.numero AS VARCHAR(64))))) = 1
              THEN LEFT(LTRIM(RTRIM(CAST(c.numero AS VARCHAR(64)))), 1)
            ELSE NULL
          END
          AS VARCHAR(8)
        ) AS cofre_letra,
        TRY_CAST(
          CASE
            WHEN c.numero IS NULL THEN NULL
            WHEN PATINDEX('[A-Za-z]%', LTRIM(RTRIM(CAST(c.numero AS VARCHAR(64))))) = 1
              THEN SUBSTRING(LTRIM(RTRIM(CAST(c.numero AS VARCHAR(64)))), 2, 63)
            ELSE LTRIM(RTRIM(CAST(c.numero AS VARCHAR(64))))
          END
          AS INT
        ) AS cofre_numero
      FROM dbo.socio_caja_seguridad scs
      INNER JOIN dbo.caja_seguridad c ON c.caja_id = scs.caja_id
      LEFT JOIN dbo.caja_seguridad_tamano t ON t.tamano_id = c.tamano_id
      WHERE scs.socio_id = :socioId

      UNION ALL

      -- LEGACY (contratos históricos)
      SELECT
        cc.contratoCofres_id AS socio_caja_id,
        cc.contratoCofres_esSocioId AS socio_id,
        cc.contratoCofres_cajaId AS caja_id,
        CAST(1 AS BIT) AS es_titular,
        cc.contratoCofres_fechaContratacion AS fecha_inicio,
        cc.contratoCofres_fechaVencimiento AS fecha_fin,
        CAST(NULL AS VARCHAR(255)) AS nota,
        COALESCE(
          c.numero,
          NULLIF(LTRIM(RTRIM(cc.contratoCofres_cajaNumero)), ''),
          CASE WHEN cc.contratoCofres_cofreNumero IS NOT NULL THEN CAST(cc.contratoCofres_cofreNumero AS VARCHAR(32)) END,
          CAST(cc.contratoCofres_id AS VARCHAR(32))
        ) AS caja_numero,
        COALESCE(c.estado, CAST('Cofres' AS VARCHAR(32))) AS caja_estado,
        c.ubicacion AS caja_ubicacion,
        t.nombre AS tamano_nombre,
        CAST('legacy' AS VARCHAR(16)) AS origen,
        cc.contratoCofres_id AS contrato_id,
        cc.contratoCofres_numero AS contrato_numero,
        cc.contratoCofres_estado AS contrato_estado,
        CAST(cc.contratoCofres_modalidad AS VARCHAR(32)) AS contrato_modalidad,
        CAST(cc.contratoCofres_cofreLetra AS VARCHAR(8)) AS cofre_letra,
        cc.contratoCofres_cofreNumero AS cofre_numero
      FROM dbo.contratoCofres cc
      LEFT JOIN dbo.caja_seguridad c ON c.caja_id = cc.contratoCofres_cajaId
      LEFT JOIN dbo.caja_seguridad_tamano t ON t.tamano_id = c.tamano_id
      WHERE cc.contratoCofres_esSocioId = :socioId
        AND ISNULL(cc.contratoCofres_deleted, 0) = 0

      ORDER BY socio_caja_id DESC
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
      mirror: {
        autoClienteId: Number(socioId),
        legacyContratoIds: contratoIds,
        clienteIdsConsultados: clienteIds,
      },
      resumen,
      movimientos: movimientosConOrigen,
      productosCofre,
      cajasAsignadas,
    };
  }
}

export default MovimientoCuentaCorrienteCofreService;
