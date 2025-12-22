import { Op } from 'sequelize';
import CajaSeguridadTamano from '../models/CajaSeguridadTamano.models';
import CajaSeguridad from '../models/CajaSeguridad.models';
import SocioCajaSeguridad from '../models/SocioCajaSeguridad.models';
import Socio from '../models/socio.models';
import { ICajaSeguridadService } from '../interfaces/IcajaSeguridad.service';

class CajaSeguridadService implements ICajaSeguridadService {
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

    const findOptions: any = {
      where: { deleted: false },
      include: [
        { model: CajaSeguridadTamano, as: 'tamano' },
        { 
          model: Socio,
          as: 'socios',
          through: { attributes: ['socio_caja_id', 'es_titular', 'fecha_inicio', 'fecha_fin', 'nota'] },
        },
      ],
    };

    if (pageSize) {
      findOptions.limit = pageSize;
      findOptions.offset = (page - 1) * pageSize;
    }

    return await CajaSeguridad.findAll(findOptions);
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
      // Autogenera el siguiente número consecutivo como string
      const maxNumero = await CajaSeguridad.max('numero', { where: {} });
      const nextNumero = Number(maxNumero || 0) + 1;
      data.numero = String(nextNumero);
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
    return await SocioCajaSeguridad.findAll({
      where: { socio_id: socioId },
      include: [
        { model: CajaSeguridad, as: 'caja', include: [{ model: CajaSeguridadTamano, as: 'tamano' }] },
      ],
    });
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

    return await SocioCajaSeguridad.create({
      socio_id: payload.socioId,
      caja_id: payload.cajaId,
      es_titular: payload.esTitular ?? true,
      fecha_inicio: payload.fechaInicio ?? new Date(),
      fecha_fin: payload.fechaFin ?? null,
      nota: payload.nota,
    });
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
