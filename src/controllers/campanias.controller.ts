import { Request, Response } from 'express';
import logger from '../configs/logger';
import Campania from '../models/Campania.models';
import SocioCampania from '../models/SocioCampania.models';
import Socio from '../models/socio.models';

class CampaniasController {
  static async listar(req: Request, res: Response) {
    try {
      const { estado } = req.query;
      const where: any = {};
      if (estado) where.estado = estado;

      const campanias = await Campania.findAll({ where, order: [['fecha_inicio', 'DESC']] });
      res.status(200).json(campanias);
    } catch (error) {
      logger.error('Error al obtener campañas', error);
      res.status(500).json({ message: 'Error al obtener campañas', error });
    }
  }

  static async obtenerPorId(req: Request, res: Response) {
    const campaniaId = Number(req.params.campaniaId);
    if (Number.isNaN(campaniaId)) {
      return res.status(400).json({ message: 'campaniaId es requerido y debe ser numérico' });
    }

    try {
      const campania = await Campania.findByPk(campaniaId);
      if (!campania) {
        return res.status(404).json({ message: 'Campaña no encontrada' });
      }
      res.status(200).json(campania);
    } catch (error) {
      logger.error('Error al obtener campaña', error);
      res.status(500).json({ message: 'Error al obtener campaña', error });
    }
  }

  static async crear(req: Request, res: Response) {
    try {
      const { nombre, descripcion, logo_url, imagen_url, fecha_inicio, fecha_fin, estado, descuento, terminos } = req.body || {};

      if (!nombre || typeof nombre !== 'string') {
        return res.status(400).json({ message: 'nombre es requerido' });
      }
      if (!fecha_inicio) {
        return res.status(400).json({ message: 'fecha_inicio es requerida' });
      }
      if (!fecha_fin) {
        return res.status(400).json({ message: 'fecha_fin es requerida' });
      }

      const campania = await Campania.create({
        nombre: nombre.trim(),
        descripcion,
        logo_url,
        imagen_url,
        fecha_inicio,
        fecha_fin,
        estado: estado || 'borrador',
        descuento,
        terminos,
      });

      res.status(201).json(campania);
    } catch (error) {
      logger.error('Error al crear campaña', error);
      res.status(500).json({ message: 'Error al crear campaña', error });
    }
  }

  static async actualizar(req: Request, res: Response) {
    const campaniaId = Number(req.params.campaniaId);
    if (Number.isNaN(campaniaId)) {
      return res.status(400).json({ message: 'campaniaId es requerido y debe ser numérico' });
    }

    try {
      const campania = await Campania.findByPk(campaniaId);
      if (!campania) {
        return res.status(404).json({ message: 'Campaña no encontrada' });
      }

      const payload: any = {};
      const allowed = ['nombre', 'descripcion', 'logo_url', 'imagen_url', 'fecha_inicio', 'fecha_fin', 'estado', 'descuento', 'terminos'];
      for (const key of allowed) {
        if ((req.body as any)[key] !== undefined) {
          payload[key] = (req.body as any)[key];
        }
      }
      payload.modificado_en = new Date();

      if (!Object.keys(payload).length) {
        return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
      }

      await campania.update(payload);
      res.status(200).json(campania);
    } catch (error) {
      logger.error('Error al actualizar campaña', error);
      res.status(500).json({ message: 'Error al actualizar campaña', error });
    }
  }

  static async eliminar(req: Request, res: Response) {
    const campaniaId = Number(req.params.campaniaId);
    if (Number.isNaN(campaniaId)) {
      return res.status(400).json({ message: 'campaniaId es requerido y debe ser numérico' });
    }

    try {
      const campania = await Campania.findByPk(campaniaId);
      if (!campania) {
        return res.status(404).json({ message: 'Campaña no encontrada' });
      }

      await campania.update({ estado: 'cancelada', modificado_en: new Date() });
      res.status(200).json({ message: 'Campaña cancelada', campaniaId });
    } catch (error) {
      logger.error('Error al cancelar campaña', error);
      res.status(500).json({ message: 'Error al cancelar campaña', error });
    }
  }

  static async asociarSocio(req: Request, res: Response) {
    const { socioId, campaniaId, notas } = req.body || {};
    const socioIdNum = Number(socioId);
    const campaniaIdNum = Number(campaniaId);

    if (Number.isNaN(socioIdNum) || Number.isNaN(campaniaIdNum)) {
      return res.status(400).json({ message: 'socioId y campaniaId son requeridos' });
    }

    try {
      const campania = await Campania.findByPk(campaniaIdNum);
      if (!campania) {
        return res.status(404).json({ message: 'Campaña no encontrada' });
      }

      const socio = await Socio.findByPk(socioIdNum);
      if (!socio) {
        return res.status(404).json({ message: 'Socio no encontrado' });
      }

      const existente = await SocioCampania.findOne({
        where: { socio_id: socioIdNum, campania_id: campaniaIdNum },
      });
      if (existente) {
        return res.status(409).json({ message: 'El socio ya está asociado a esta campaña' });
      }

      const asociacion = await SocioCampania.create({
        socio_id: socioIdNum,
        campania_id: campaniaIdNum,
        notas,
      });

      res.status(201).json(asociacion);
    } catch (error) {
      logger.error('Error al asociar socio a campaña', error);
      res.status(500).json({ message: 'Error al asociar socio a campaña', error });
    }
  }

  static async asociarSociosBulk(req: Request, res: Response) {
    const { socioIds, campaniaId, notas } = req.body || {};
    const campaniaIdNum = Number(campaniaId);

    if (!Array.isArray(socioIds) || !socioIds.length || Number.isNaN(campaniaIdNum)) {
      return res.status(400).json({ message: 'socioIds (array) y campaniaId son requeridos' });
    }

    try {
      const campania = await Campania.findByPk(campaniaIdNum);
      if (!campania) {
        return res.status(404).json({ message: 'Campaña no encontrada' });
      }

      const resultados: any[] = [];
      for (const sid of socioIds) {
        const socioIdNum = Number(sid);
        if (Number.isNaN(socioIdNum)) continue;

        const existente = await SocioCampania.findOne({
          where: { socio_id: socioIdNum, campania_id: campaniaIdNum },
        });
        if (existente) continue;

        const asociacion = await SocioCampania.create({
          socio_id: socioIdNum,
          campania_id: campaniaIdNum,
          notas,
        });
        resultados.push(asociacion);
      }

      res.status(201).json({ message: `${resultados.length} socios asociados`, asociaciones: resultados });
    } catch (error) {
      logger.error('Error al asociar socios a campaña (bulk)', error);
      res.status(500).json({ message: 'Error al asociar socios a campaña', error });
    }
  }

  static async aceptarCampania(req: Request, res: Response) {
    const socioCampaniaId = Number(req.params.socioCampaniaId);
    if (Number.isNaN(socioCampaniaId)) {
      return res.status(400).json({ message: 'socioCampaniaId es requerido' });
    }

    try {
      const asociacion = await SocioCampania.findByPk(socioCampaniaId);
      if (!asociacion) {
        return res.status(404).json({ message: 'Asociación no encontrada' });
      }

      await asociacion.update({ estado: 'aceptada', aceptado_en: new Date() });
      res.status(200).json(asociacion);
    } catch (error) {
      logger.error('Error al aceptar campaña', error);
      res.status(500).json({ message: 'Error al aceptar campaña', error });
    }
  }

  static async rechazarCampania(req: Request, res: Response) {
    const socioCampaniaId = Number(req.params.socioCampaniaId);
    if (Number.isNaN(socioCampaniaId)) {
      return res.status(400).json({ message: 'socioCampaniaId es requerido' });
    }

    try {
      const asociacion = await SocioCampania.findByPk(socioCampaniaId);
      if (!asociacion) {
        return res.status(404).json({ message: 'Asociación no encontrada' });
      }

      await asociacion.update({ estado: 'rechazada' });
      res.status(200).json(asociacion);
    } catch (error) {
      logger.error('Error al rechazar campaña', error);
      res.status(500).json({ message: 'Error al rechazar campaña', error });
    }
  }

  static async listarPorSocio(req: Request, res: Response) {
    const socioId = Number(req.params.socioId);
    if (Number.isNaN(socioId)) {
      return res.status(400).json({ message: 'socioId es requerido y debe ser numérico' });
    }

    try {
      const asociaciones = await SocioCampania.findAll({
        where: { socio_id: socioId },
        include: [{ model: Campania, as: 'campania' }],
        order: [['creado_en', 'DESC']],
      });

      res.status(200).json(asociaciones);
    } catch (error) {
      logger.error('Error al obtener campañas del socio', error);
      res.status(500).json({ message: 'Error al obtener campañas del socio', error });
    }
  }

  static async listarSociosPorCampania(req: Request, res: Response) {
    const campaniaId = Number(req.params.campaniaId);
    if (Number.isNaN(campaniaId)) {
      return res.status(400).json({ message: 'campaniaId es requerido y debe ser numérico' });
    }

    try {
      const asociaciones = await SocioCampania.findAll({
        where: { campania_id: campaniaId },
        include: [{
          model: Socio,
          as: 'socio',
          attributes: ['socio_id', 'socio_nombre', 'socio_mail', 'socio_celular', 'socio_estado'],
        }],
      });

      const response = asociaciones.map((a: any) => ({
        socio_campania_id: a.socio_campania_id,
        socio_id: a.socio_id,
        socio_nombre: a.socio?.socio_nombre || null,
        socio_mail: a.socio?.socio_mail || null,
        socio_celular: a.socio?.socio_celular || null,
        estado: a.estado,
        aceptado_en: a.aceptado_en,
        notas: a.notas,
        creado_en: a.creado_en,
      }));

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error al obtener socios de campaña', error);
      res.status(500).json({ message: 'Error al obtener socios de campaña', error });
    }
  }

  static async eliminarAsociacion(req: Request, res: Response) {
    const socioCampaniaId = Number(req.params.socioCampaniaId);
    if (Number.isNaN(socioCampaniaId)) {
      return res.status(400).json({ message: 'socioCampaniaId es requerido' });
    }

    try {
      const asociacion = await SocioCampania.findByPk(socioCampaniaId);
      if (!asociacion) {
        return res.status(404).json({ message: 'Asociación no encontrada' });
      }

      await asociacion.destroy();
      res.status(200).json({ message: 'Asociación eliminada' });
    } catch (error) {
      logger.error('Error al eliminar asociación de campaña', error);
      res.status(500).json({ message: 'Error al eliminar asociación de campaña', error });
    }
  }
}

export default CampaniasController;
