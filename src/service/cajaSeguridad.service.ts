import { Op, QueryTypes } from 'sequelize';
import CajaSeguridadTamano from '../models/CajaSeguridadTamano.models';
import CajaSeguridad from '../models/CajaSeguridad.models';
import SocioCajaSeguridad from '../models/SocioCajaSeguridad.models';
import Socio from '../models/socio.models';
import { ICajaSeguridadService } from '../interfaces/IcajaSeguridad.service';
import ContratoCofresService, { ServiceError } from './contratoCofres.service';
import sequelize from '../configs/database';

class CajaSeguridadService implements ICajaSeguridadService {
  private contratoCofresService = new ContratoCofresService();

  async getTamanos(): Promise<any[]> {
    return await CajaSeguridadTamano.findAll({ where: { activo: true } });
  }

  async createTamano(data: any): Promise<any> {
    const mensualNumber = Number(data.precio_mensual);
    const anualNumber = Number(data.precio_anual);

    data.precio_mensual = Number.isFinite(mensualNumber) ? mensualNumber : 0;
    data.precio_anual = Number.isFinite(anualNumber) ? anualNumber : 0;
    return await CajaSeguridadTamano.create(data);
  }

  async updateTamano(id: number, data: any): Promise<[number, any[]]> {
    return await CajaSeguridadTamano.update(data, { where: { tamano_id: id }, returning: true });
  }

  async getCajas(options?: { page?: number; pageSize?: number }): Promise<any[]> {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const pageSize = options?.pageSize && options.pageSize > 0 ? options.pageSize : undefined;

    // Cajas del modelo nuevo (AUTO)
    const cajasAuto = await CajaSeguridad.findAll({
      where: { deleted: false },
      include: [
        { model: CajaSeguridadTamano, as: 'tamano' },
        {
          model: Socio,
          as: 'socios',
          through: { attributes: ['socio_caja_id', 'es_titular', 'fecha_inicio', 'fecha_fin', 'nota'] },
        },
      ],
    });

    // Cajas legacy desde contratos históricos (aunque no exista caja_id en el modelo nuevo)
    const legacyRows = await sequelize.query(
      `
      SELECT
        cc.contratoCofres_id,
        cc.contratoCofres_esSocioId,
        cc.contratoCofres_cajaNumero,
        cc.contratoCofres_cofreNumero,
        cc.contratoCofres_fechaContratacion,
        cc.contratoCofres_fechaVencimiento,
        cc.contratoCofres_estado,
        s.socio_nombre,
        s.socio_dni,
        s.socio_mail
      FROM dbo.contratoCofres cc
      LEFT JOIN dbo.socio s ON s.socio_id = cc.contratoCofres_esSocioId
      WHERE ISNULL(cc.contratoCofres_deleted, 0) = 0
        AND (
          cc.contratoCofres_fechaVencimiento IS NULL
          OR cc.contratoCofres_fechaVencimiento >= CAST(GETDATE() AS date)
        )
      ORDER BY cc.contratoCofres_id DESC
      `,
      { type: QueryTypes.SELECT }
    ) as any[];

    const legacyCajas = legacyRows.map((r) => ({
      id: -Number(r.contratoCofres_id),
      numero:
        String(r.contratoCofres_cajaNumero || '').trim() ||
        (r.contratoCofres_cofreNumero != null ? String(r.contratoCofres_cofreNumero) : String(r.contratoCofres_id)),
      estado: 'Habilitado',
      ubicacion: 'Legacy',
      tamanoId: 0,
      origen: 'legacy',
      legacyContratoId: Number(r.contratoCofres_id),
      socios: [
        {
          id: Number(r.contratoCofres_esSocioId),
          socioId: Number(r.contratoCofres_esSocioId),
          socioNombre: r.socio_nombre,
          socioDni: r.socio_dni,
          socioMail: r.socio_mail,
          esTitular: true,
          fechaInicio: r.contratoCofres_fechaContratacion,
          fechaFin: r.contratoCofres_fechaVencimiento,
          nota: `Contrato legacy #${r.contratoCofres_id}`,
        },
      ],
      titularNombre: r.socio_nombre,
      nota: `Contrato legacy #${r.contratoCofres_id}`,
    }));

    const combinadas = [...cajasAuto, ...legacyCajas];

    if (!pageSize) return combinadas;

    const start = (page - 1) * pageSize;
    return combinadas.slice(start, start + pageSize);
  }

  async getCajaById(id: number): Promise<any | null> {
    return await CajaSeguridad.findOne({
      where: { caja_id: id, deleted: false },
      include: [
        { model: CajaSeguridadTamano, as: 'tamano' },
        { 
          model: Socio,
          as: 'socios',
          through: { attributes: ['socio_caja_id', 'es_titular', 'fecha_inicio', 'fecha_fin', 'nota'] },
        },
      ],
    });
  }

  async createCaja(data: any): Promise<any> {
    data.deleted = false;

    if (!data.numero) {
      // Autogenera siguiente número usando cast numérico para evitar max lexicográfico de strings.
      const row = (await sequelize.query(
        `
          SELECT ISNULL(MAX(TRY_CAST(numero AS INT)), 0) AS maxNumero
          FROM dbo.caja_seguridad
        `,
        { type: QueryTypes.SELECT },
      )) as any[];

      const maxNumero = Number(row?.[0]?.maxNumero || 0);
      data.numero = String(maxNumero + 1);
    }

    return await CajaSeguridad.create(data);
  }

  async updateCaja(id: number, data: any): Promise<[number, any[]]> {
    return await CajaSeguridad.update(data, { where: { caja_id: id, deleted: false }, returning: true });
  }

  async deleteCaja(id: number): Promise<any | null> {
    const [count] = await CajaSeguridad.update(
      { deleted: true },
      { where: { caja_id: id, deleted: false }, returning: false },
    );
    if (count === 0) {
      return null;
    }
    return { caja_id: id, deleted: true };
  }

  async getSociosByCaja(cajaId: number): Promise<any[]> {
    return await SocioCajaSeguridad.findAll({
      where: { caja_id: cajaId },
      include: [
        { model: Socio, as: 'socio' },
      ],
    });
  }

  async getCajasBySocio(socioId: number): Promise<any[]> {
    const cajasNuevas = await SocioCajaSeguridad.findAll({
      where: { socio_id: socioId },
      include: [
        { model: CajaSeguridad, as: 'caja', include: [{ model: CajaSeguridadTamano, as: 'tamano' }] },
      ],
    });

    const legacyRows = await sequelize.query(
      `
      SELECT
        cc.contratoCofres_id,
        cc.contratoCofres_esSocioId,
        cc.contratoCofres_cajaNumero,
        cc.contratoCofres_cofreNumero,
        cc.contratoCofres_fechaContratacion,
        cc.contratoCofres_fechaVencimiento,
        cc.contratoCofres_estado
      FROM dbo.contratoCofres cc
      WHERE cc.contratoCofres_esSocioId = :socioId
        AND ISNULL(cc.contratoCofres_deleted, 0) = 0
      ORDER BY cc.contratoCofres_id DESC
      `,
      { replacements: { socioId }, type: QueryTypes.SELECT }
    ) as any[];

    const cajasLegacy = legacyRows.map((r) => ({
      socio_caja_id: -Number(r.contratoCofres_id),
      socio_id: Number(r.contratoCofres_esSocioId),
      caja_id: -Number(r.contratoCofres_id),
      es_titular: true,
      fecha_inicio: r.contratoCofres_fechaContratacion,
      fecha_fin: r.contratoCofres_fechaVencimiento,
      nota: `Contrato legacy #${r.contratoCofres_id}`,
      origen: 'legacy',
      caja: {
        caja_id: -Number(r.contratoCofres_id),
        numero: String(r.contratoCofres_cajaNumero || r.contratoCofres_cofreNumero || r.contratoCofres_id),
        estado: r.contratoCofres_estado || 'Habilitado',
        ubicacion: 'Legacy',
        tamano: null,
      },
    }));

    return [...cajasNuevas, ...cajasLegacy];
  }

  async getCofresVencidos(): Promise<any[]> {
    return await sequelize.query(
      `
      WITH base AS (
        SELECT
          cc.contratoCofres_esSocioId AS socio_id,
          cc.contratoCofres_nombre AS socio_nombre,
          cc.contratoCofres_id AS contrato_id,
          cc.contratoCofres_fechaVencimiento AS fecha_vencimiento,
          CASE WHEN cc.contratoCofres_fechaVencimiento < CAST(GETDATE() AS date) THEN 1 ELSE 0 END AS vencido
        FROM dbo.contratoCofres cc
        WHERE ISNULL(cc.contratoCofres_deleted, 0) = 0
          AND cc.contratoCofres_esSocioId > 0
      ), agg AS (
        SELECT
          socio_id,
          MAX(socio_nombre) AS socio_nombre,
          COUNT(*) AS contratos_total,
          SUM(vencido) AS contratos_vencidos
        FROM base
        GROUP BY socio_id
        HAVING COUNT(*) > 1 AND SUM(vencido) > 0
      )
      SELECT
        a.socio_id,
        a.socio_nombre,
        a.contratos_total,
        a.contratos_vencidos,
        b.contrato_id,
        b.fecha_vencimiento,
        b.vencido
      FROM agg a
      INNER JOIN base b ON b.socio_id = a.socio_id
      ORDER BY a.contratos_vencidos DESC, a.contratos_total DESC, a.socio_id, b.fecha_vencimiento DESC
      `,
      { type: QueryTypes.SELECT }
    ) as any[];
  }

  async assignSocioACaja(payload: { socioId: number; cajaId: number; esTitular?: boolean; fechaInicio?: string; fechaFin?: string | null; nota?: string }): Promise<any> {
    const socio = await Socio.findOne({ where: { socio_id: payload.socioId } });
    const caja = await CajaSeguridad.findOne({ where: { caja_id: payload.cajaId, deleted: false } });

    if (!socio || !caja) {
      throw new Error('Socio o caja no encontrado');
    }

    const yaExiste = await SocioCajaSeguridad.findOne({
      where: {
        socio_id: payload.socioId,
        caja_id: payload.cajaId,
        fecha_fin: { [Op.is]: null },
      },
    });

    if (yaExiste) {
      return { alreadyAssigned: true, asignacion: yaExiste };
    }

    const asignacion = await SocioCajaSeguridad.create({
      socio_id: payload.socioId,
      caja_id: payload.cajaId,
      es_titular: payload.esTitular ?? true,
      fecha_inicio: payload.fechaInicio ?? new Date(),
      fecha_fin: payload.fechaFin ?? null,
      nota: payload.nota,
    });

    try {
      const contrato = await this.contratoCofresService.createContratoCofre({
        socioId: payload.socioId,
        cajaId: payload.cajaId,
        fechaInicio: payload.fechaInicio,
      });
      return { ...asignacion.get({ plain: true }), contrato };
    } catch (error: any) {
      // No revertimos la asignación: la caja queda creada/asignada y el contrato se podrá generar luego.
      const warning =
        error instanceof ServiceError
          ? error.message
          : 'Asignación creada, pero no se pudo generar el contrato automáticamente';
      return { ...asignacion.get({ plain: true }), contrato: null, warning };
    }
  }

  async unassignSocioDeCaja(socioId: number, cajaId: number): Promise<{ socioCajaId: number; cajaId: number; socioId: number } | null> {
    const asignacion = await SocioCajaSeguridad.findOne({
      where: { socio_id: socioId, caja_id: cajaId },
      attributes: ['socio_caja_id', 'caja_id', 'socio_id', 'fecha_fin'],
      order: [['socio_caja_id', 'DESC']],
    });
    if (!asignacion) {
      return null;
    }

    const sociosActivosEnCaja = await SocioCajaSeguridad.count({
      where: { caja_id: cajaId, fecha_fin: { [Op.is]: null } },
    });

    const asignacionActiva = asignacion.get('fecha_fin') === null;
    if (asignacionActiva && sociosActivosEnCaja <= 1) {
      const error: any = new Error('No se puede desasignar: la caja solo tiene un socio activo');
      error.code = 'CAJA_UNICO_SOCIO';
      throw error;
    }

    const data = {
      socioCajaId: asignacion.socio_caja_id,
      cajaId: asignacion.caja_id,
      socioId: asignacion.socio_id,
    };
    await asignacion.destroy();
    return data;
  }
}

export default CajaSeguridadService;
