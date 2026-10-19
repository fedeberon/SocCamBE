import { Op } from 'sequelize';
import { IAcontecimientoService } from '../interfaces/Iacontecimiento.service';
import Acontecimiento from '../models/acontecimiento.models';
import AcontecimientoSocio from '../models/acontecimientoSocio.models';
import AcontecimientoUbicacion from '../models/acontecimientoUbicacion.models';
import AcontecimientoCategoria from '../models/acontecimientoCategoria.models';
import Socio from '../models/socio.models';

const ESTADOS_VALIDOS = ['borrador', 'publicado', 'en_curso', 'finalizado', 'cancelado'];

class AcontecimientoService implements IAcontecimientoService {
  private errorValidacion(mensaje: string) {
    const err: any = new Error(mensaje);
    err.name = 'ValidacionEvento';
    return err;
  }

  private errorNoEncontrado(mensaje: string) {
    const err: any = new Error(mensaje);
    err.name = 'NoEncontradoEvento';
    return err;
  }

  private normalizarEstado(estado: any): string {
    if (estado == null || estado === '') return 'borrador';
    const valor = String(estado).toLowerCase();
    if (!ESTADOS_VALIDOS.includes(valor)) {
      throw this.errorValidacion(`Estado inválido: ${estado}`);
    }
    return valor;
  }

  private normalizarSocioIds(socios: any): number[] {
    if (!Array.isArray(socios)) return [];
    const ids = socios
      .map((s) => Number(s?.socio_id ?? s?.socioId ?? s))
      .filter((n) => Number.isFinite(n));
    return Array.from(new Set(ids));
  }

  private async resolverUbicacion(payload: any): Promise<number> {
    const id = payload?.ubicacion_id ?? payload?.ubicacionId;
    if (id != null && id !== '' && !Number.isNaN(Number(id))) {
      const ubicacion = await AcontecimientoUbicacion.findByPk(Number(id));
      if (!ubicacion) throw this.errorValidacion('La ubicación indicada no existe');
      return ubicacion.ubicacion_id;
    }
    const nombre = String(payload?.ubicacion_nombre ?? payload?.ubicacionNombre ?? '').trim();
    if (nombre) {
      const [ubicacion] = await AcontecimientoUbicacion.findOrCreate({
        where: { nombre },
        defaults: { nombre },
      });
      return ubicacion.ubicacion_id;
    }
    throw this.errorValidacion('La ubicación es requerida');
  }

  private async resolverCategoria(payload: any): Promise<number> {
    const id = payload?.categoria_id ?? payload?.categoriaId;
    if (id != null && id !== '' && !Number.isNaN(Number(id))) {
      const categoria = await AcontecimientoCategoria.findByPk(Number(id));
      if (!categoria) throw this.errorValidacion('La categoría indicada no existe');
      return categoria.categoria_id;
    }
    const nombre = String(payload?.categoria_nombre ?? payload?.categoriaNombre ?? '').trim();
    if (nombre) {
      const [categoria] = await AcontecimientoCategoria.findOrCreate({
        where: { nombre },
        defaults: { nombre },
      });
      return categoria.categoria_id;
    }
    const [general] = await AcontecimientoCategoria.findOrCreate({
      where: { nombre: 'General' },
      defaults: { nombre: 'General' },
    });
    return general.categoria_id;
  }

  private validarFechas(fecha: any, fechaFin: any) {
    if (!fecha) throw this.errorValidacion('La fecha de inicio es requerida');
    if (fechaFin && new Date(fechaFin).getTime() < new Date(fecha).getTime()) {
      throw this.errorValidacion('La fecha de fin no puede ser anterior a la fecha de inicio');
    }
  }

  private formatearLocal(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  private normalizarFecha(valor: any): any {
    if (valor === null || valor === undefined || valor === '') return null;
    if (valor instanceof Date) {
      return Number.isNaN(valor.getTime()) ? null : this.formatearLocal(valor);
    }
    const s = String(valor).trim();
    // date-only: se guarda tal cual (DATEONLY/datetime a medianoche)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    // datetime-local ("YYYY-MM-DDTHH:mm") o ISO con Z: formatear local sin offset,
    // porque SQL Server datetime no acepta el sufijo de zona horaria.
    return this.formatearLocal(d);
  }

  private normalizarCupo(cupo: any): number | null {
    if (cupo == null || cupo === '') return null;
    const valor = Number(cupo);
    if (Number.isNaN(valor) || valor < 0) {
      throw this.errorValidacion('El cupo debe ser un número mayor o igual a 0');
    }
    return Math.floor(valor);
  }

  async getAllAcontecimientos(estado?: string): Promise<any[]> {
    const where: any = { deleted: false };
    if (estado) where.estado = estado;

    return await Acontecimiento.findAll({
      where,
      include: [
        { model: AcontecimientoUbicacion, as: 'ubicacion' },
        { model: AcontecimientoCategoria, as: 'categoria' },
        { model: Socio, as: 'socios' },
      ],
      order: [['fecha', 'DESC']],
    });
  }

  async getAcontecimientoById(id: number): Promise<any> {
    return await Acontecimiento.findOne({
      where: { acontecimiento_id: id, deleted: false },
      include: [
        { model: AcontecimientoUbicacion, as: 'ubicacion' },
        { model: AcontecimientoCategoria, as: 'categoria' },
        { model: Socio, as: 'socios' },
      ],
    });
  }

  async getAcontecimientosBySocio(socioId: number): Promise<any[]> {
    return await Acontecimiento.findAll({
      include: [
        { model: Socio, as: 'socios', where: { socio_id: socioId } },
        { model: AcontecimientoUbicacion, as: 'ubicacion' },
        { model: AcontecimientoCategoria, as: 'categoria' },
      ],
      where: {
        deleted: false,
        estado: { [Op.notIn]: ['borrador', 'cancelado'] },
      },
      order: [['fecha', 'DESC']],
    });
  }

  async listarUbicaciones(): Promise<any[]> {
    return await AcontecimientoUbicacion.findAll({ order: [['nombre', 'ASC']] });
  }

  async listarCategorias(): Promise<any[]> {
    return await AcontecimientoCategoria.findAll({ order: [['nombre', 'ASC']] });
  }

  async crearAcontecimiento(payload: any): Promise<any> {
    const nombre = String(payload?.nombre ?? payload?.titulo ?? '').trim();
    if (!nombre) throw this.errorValidacion('El título es requerido');

    const fecha = this.normalizarFecha(payload?.fecha ?? payload?.fecha_inicio ?? payload?.fechaInicio);
    const fechaFin = this.normalizarFecha(payload?.fecha_fin ?? payload?.fechaFin ?? null);
    this.validarFechas(fecha, fechaFin);

    const ubicacion_id = await this.resolverUbicacion(payload);
    const categoria_id = await this.resolverCategoria(payload);
    const estado = this.normalizarEstado(payload?.estado);
    const cupo = this.normalizarCupo(payload?.cupo);

    const creado = await Acontecimiento.create({
      nombre,
      descripcion: payload?.descripcion ?? null,
      fecha,
      fecha_fin: fechaFin || null,
      estado,
      cupo,
      imagen_url: payload?.imagen_url ?? payload?.imagenUrl ?? null,
      ubicacion_id,
      categoria_id,
      deleted: false,
      modificado: this.formatearLocal(new Date()),
      creado_en: this.formatearLocal(new Date()),
    });

    const socios = this.normalizarSocioIds(payload?.socios);
    if (socios.length) {
      await this.asignarSocios(creado.acontecimiento_id, socios);
    }

    return await this.getAcontecimientoById(creado.acontecimiento_id);
  }

  async actualizarAcontecimiento(id: number, payload: any): Promise<any> {
    const evento = await Acontecimiento.findOne({
      where: { acontecimiento_id: id, deleted: false },
    });
    if (!evento) throw this.errorNoEncontrado('Evento no encontrado');

    const campos: any = {};

    if (payload?.nombre !== undefined || payload?.titulo !== undefined) {
      const nombre = String(payload?.nombre ?? payload?.titulo ?? '').trim();
      if (!nombre) throw this.errorValidacion('El título es requerido');
      campos.nombre = nombre;
    }

    const fechaRaw = payload?.fecha !== undefined ? payload.fecha : (payload?.fecha_inicio ?? payload?.fechaInicio);
    const fechaFinRaw = payload?.fecha_fin !== undefined ? payload.fecha_fin : payload?.fechaFin;
    if (fechaRaw !== undefined) {
      const fecha = this.normalizarFecha(fechaRaw);
      const fechaFin = fechaFinRaw !== undefined ? this.normalizarFecha(fechaFinRaw) : undefined;
      this.validarFechas(fecha, fechaFin !== undefined ? fechaFin : evento.fecha_fin);
      campos.fecha = fecha;
    }
    if (fechaFinRaw !== undefined) {
      const fechaFin = this.normalizarFecha(fechaFinRaw);
      this.validarFechas(campos.fecha ?? evento.fecha, fechaFin);
      campos.fecha_fin = fechaFin || null;
    }

    if (payload?.estado !== undefined) {
      campos.estado = this.normalizarEstado(payload.estado);
    }
    if (payload?.cupo !== undefined) {
      campos.cupo = this.normalizarCupo(payload.cupo);
    }
    if (payload?.descripcion !== undefined) {
      campos.descripcion = payload.descripcion;
    }
    if (payload?.imagen_url !== undefined || payload?.imagenUrl !== undefined) {
      campos.imagen_url = payload?.imagen_url ?? payload?.imagenUrl ?? null;
    }
    if (payload?.ubicacion_id !== undefined || payload?.ubicacionId !== undefined || (payload?.ubicacion_nombre ?? payload?.ubicacionNombre)) {
      campos.ubicacion_id = await this.resolverUbicacion(payload);
    }
    if (payload?.categoria_id !== undefined || payload?.categoriaId !== undefined || (payload?.categoria_nombre ?? payload?.categoriaNombre)) {
      campos.categoria_id = await this.resolverCategoria(payload);
    }

    campos.modificado = this.formatearLocal(new Date());
    await evento.update(campos);

    const socios = payload?.socios;
    if (Array.isArray(socios)) {
      const ids = this.normalizarSocioIds(socios);
      await AcontecimientoSocio.destroy({ where: { acontecimiento_id: id } });
      if (ids.length) {
        await this.asignarSocios(id, ids);
      }
    }

    return await this.getAcontecimientoById(id);
  }

  async eliminarAcontecimiento(id: number): Promise<any> {
    const evento = await Acontecimiento.findOne({
      where: { acontecimiento_id: id, deleted: false },
    });
    if (!evento) throw this.errorNoEncontrado('Evento no encontrado');

    await evento.update({ deleted: true, modificado: this.formatearLocal(new Date()) });
    return { message: 'Evento eliminado', acontecimiento_id: id };
  }

  async listarSociosDeAcontecimiento(id: number): Promise<any[]> {
    const asociaciones = await AcontecimientoSocio.findAll({
      where: { acontecimiento_id: id },
    });
    const ids = asociaciones.map((a: any) => Number(a.socio_id));
    if (!ids.length) return [];

    return await Socio.findAll({
      where: { socio_id: { [Op.in]: ids } },
      attributes: ['socio_id', 'socio_nombre', 'socio_mail', 'socio_celular', 'socio_dni', 'socio_cuit'],
    });
  }

  async asignarSocios(id: number, socioIds: number[]): Promise<any> {
    const ids = this.normalizarSocioIds(socioIds);
    if (!ids.length) return { asignados: 0, total: 0 };

    const existentes = await AcontecimientoSocio.findAll({
      where: { acontecimiento_id: id, socio_id: { [Op.in]: ids } },
    });
    const yaAsignados = new Set(existentes.map((e: any) => Number(e.socio_id)));
    const nuevos = ids.filter((socio_id) => !yaAsignados.has(socio_id));

    for (const socio_id of nuevos) {
      await AcontecimientoSocio.create({ acontecimiento_id: id, socio_id });
    }

    return { asignados: nuevos.length, total: ids.length };
  }

  async desasignarSocio(id: number, socioId: number): Promise<any> {
    await AcontecimientoSocio.destroy({
      where: { acontecimiento_id: id, socio_id: socioId },
    });
    return { message: 'Socio quitado del evento' };
  }
}

export default AcontecimientoService;
