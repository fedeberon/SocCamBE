import { Request, Response } from 'express';
import logger from '../configs/logger';
import SocioServicio from '../models/SocioServicio.models';
import Servicio from '../models/Servicio.models';

class ServiciosController {
  static async listar(req: Request, res: Response) {
    try {
      const servicios = await Servicio.findAll();
      res.status(200).json(servicios);
    } catch (error) {
      logger.error('Error al obtener servicios', error);
      res.status(500).json({ message: 'Error al obtener servicios', error });
    }
  }

  static async crear(req: Request, res: Response) {
    try {
      const { nombre, descripcion, categoria, activo } = req.body || {};

      if (!nombre || typeof nombre !== 'string') {
        return res.status(400).json({ message: 'nombre es requerido' });
      }

      const servicio = await Servicio.create({
        nombre: nombre.trim(),
        descripcion,
        categoria,
        activo: typeof activo === 'boolean' ? activo : true,
      });

      res.status(201).json(servicio);
    } catch (error) {
      logger.error('Error al crear servicio', error);
      res.status(500).json({ message: 'Error al crear servicio', error });
    }
  }

  static async actualizar(req: Request, res: Response) {
    const servicioId = Number(req.params.servicioId);
    if (Number.isNaN(servicioId)) {
      return res.status(400).json({ message: 'servicioId es requerido y debe ser numérico' });
    }

    const { nombre, descripcion, categoria, activo } = req.body || {};

    if (nombre !== undefined && (typeof nombre !== 'string' || !nombre.trim())) {
      return res.status(400).json({ message: 'nombre debe ser un string no vacío' });
    }

    try {
      const servicio = await Servicio.findByPk(servicioId);
      if (!servicio) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }

      const payload: { nombre?: string; descripcion?: string; categoria?: string; activo?: boolean } = {};
      if (nombre !== undefined) payload.nombre = nombre.trim();
      if (descripcion !== undefined) payload.descripcion = descripcion;
      if (categoria !== undefined) payload.categoria = categoria;
      if (typeof activo === 'boolean') payload.activo = activo;

      if (!Object.keys(payload).length) {
        return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
      }

      await servicio.update(payload);
      res.status(200).json(servicio);
    } catch (error) {
      logger.error('Error al actualizar servicio', error);
      res.status(500).json({ message: 'Error al actualizar servicio', error });
    }
  }

  static async bajaLogica(req: Request, res: Response) {
    const servicioId = Number(req.params.servicioId);
    if (Number.isNaN(servicioId)) {
      return res.status(400).json({ message: 'servicioId es requerido y debe ser numérico' });
    }

    try {
      const servicio = await Servicio.findByPk(servicioId);
      if (!servicio) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }

      if (servicio.getDataValue('activo') === false) {
        return res.status(200).json({ message: 'Servicio ya estaba dado de baja', servicioId });
      }

      await servicio.update({ activo: false });
      res.status(200).json({ message: 'Servicio dado de baja', servicioId });
    } catch (error) {
      logger.error('Error al dar de baja servicio', error);
      res.status(500).json({ message: 'Error al dar de baja servicio', error });
    }
  }

  static async crearAsociacion(req: Request, res: Response) {
    const { socioId, servicioId, notas, contacto } = req.body || {};

    const socioIdNum = Number(socioId);
    const servicioIdNum = Number(servicioId);

    if (Number.isNaN(socioIdNum) || Number.isNaN(servicioIdNum)) {
      return res.status(400).json({ message: 'socioId y servicioId son requeridos' });
    }

    try {
      const servicio = await Servicio.findByPk(servicioIdNum);
      if (!servicio) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }

      const existente = await SocioServicio.findOne({ where: { socio_id: socioIdNum, servicio_id: servicioIdNum } });
      if (existente) {
        return res.status(409).json({ message: 'El socio ya tiene este servicio asociado' });
      }

      const contactoNombre = contacto?.nombre ?? contacto?.contacto_nombre;
      const contactoEmail = contacto?.email ?? contacto?.contacto_email;
      const contactoTelefono = contacto?.telefono ?? contacto?.contacto_telefono;

      const asociacion = await SocioServicio.create({
        socio_id: socioIdNum,
        servicio_id: servicioIdNum,
        notas,
        contacto_nombre: contactoNombre,
        contacto_email: contactoEmail,
        contacto_telefono: contactoTelefono,
      });

      res.status(201).json(asociacion);
    } catch (error) {
      logger.error('Error al crear asociación socio-servicio', error);
      res.status(500).json({ message: 'Error al crear asociación socio-servicio', error });
    }
  }

  static async listarAsociacionesPorSocio(req: Request, res: Response) {
    const socioId = Number(req.params.socioId);
    if (Number.isNaN(socioId)) {
      return res.status(400).json({ message: 'socioId es requerido y debe ser numérico' });
    }

    try {
      const asociaciones = await SocioServicio.findAll({
        where: { socio_id: socioId },
        include: [{ model: Servicio, as: 'servicio' }],
      });

      if (!asociaciones.length) {
        return res.status(404).json({ message: 'No se encontraron asociaciones para este socio' });
      }

      res.status(200).json(asociaciones);
    } catch (error) {
      logger.error('Error al obtener asociaciones socio-servicio', error);
      res.status(500).json({ message: 'Error al obtener asociaciones socio-servicio', error });
    }
  }

  static async eliminarAsociacion(req: Request, res: Response) {
    const socioId = Number(req.params.socioId || req.body?.socioId);
    const servicioId = Number(req.params.servicioId || req.body?.servicioId);

    if (Number.isNaN(socioId) || Number.isNaN(servicioId)) {
      return res.status(400).json({ message: 'socioId y servicioId son requeridos y deben ser numéricos' });
    }

    try {
      const asociacion = await SocioServicio.findOne({ where: { socio_id: socioId, servicio_id: servicioId } });
      if (!asociacion) {
        return res.status(404).json({ message: 'Asociación socio-servicio no encontrada' });
      }

      await asociacion.destroy();
      res.status(200).json({ message: 'Asociación eliminada', socioId, servicioId });
    } catch (error) {
      logger.error('Error al eliminar asociación socio-servicio', error);
      res.status(500).json({ message: 'Error al eliminar asociación socio-servicio', error });
    }
  }
}

export default ServiciosController;
