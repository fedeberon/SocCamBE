import { Request, Response } from 'express';
import logger from '../configs/logger';
import CajaSeguridadService from '../service/cajaSeguridad.service';
import { ICajaSeguridadService } from '../interfaces/IcajaSeguridad.service';

class CajaSeguridadController {
  private static cajaSeguridadService: ICajaSeguridadService = new CajaSeguridadService();

  static async getTamanos(req: Request, res: Response) {
    try {
      const tamanos = await CajaSeguridadController.cajaSeguridadService.getTamanos();
      res.status(200).json(tamanos);
    } catch (error) {
      logger.error('Error al obtener tamaños de caja:', error);
      res.status(500).json({ message: 'Error al obtener tamaños de caja', error });
    }
  }

  static async createTamano(req: Request, res: Response) {
    try {
      const body = { ...req.body };
      body.precio_mensual = Number.isFinite(Number(body.precio_mensual)) ? Number(body.precio_mensual) : 0;
      body.precio_anual = Number.isFinite(Number(body.precio_anual)) ? Number(body.precio_anual) : 0;
      const tamano = await CajaSeguridadController.cajaSeguridadService.createTamano(body);
      res.status(201).json(tamano);
    } catch (error) {
      logger.error('Error al crear tamaño de caja:', error);
      res.status(500).json({ message: 'Error al crear tamaño de caja', error });
    }
  }

  static async updateTamano(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const [count, updated] = await CajaSeguridadController.cajaSeguridadService.updateTamano(Number(id), req.body);
      if (count === 0) {
        return res.status(404).json({ message: 'Tamaño no encontrado' });
      }
      res.status(200).json(updated[0]);
    } catch (error) {
      logger.error('Error al actualizar tamaño de caja:', error);
      res.status(500).json({ message: 'Error al actualizar tamaño de caja', error });
    }
  }

  static async getCajas(req: Request, res: Response) {
    try {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

      const cajas = await CajaSeguridadController.cajaSeguridadService.getCajas({ page, pageSize });
      res.status(200).json(cajas);
    } catch (error) {
      logger.error('Error al obtener cajas de seguridad:', error);
      res.status(500).json({ message: 'Error al obtener cajas de seguridad', error });
    }
  }

  static async getCajaById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const caja = await CajaSeguridadController.cajaSeguridadService.getCajaById(Number(id));
      if (!caja) {
        return res.status(404).json({ message: 'Caja no encontrada' });
      }
      res.status(200).json(caja);
    } catch (error) {
      logger.error('Error al obtener la caja de seguridad:', error);
      res.status(500).json({ message: 'Error al obtener la caja de seguridad', error });
    }
  }

  static async createCaja(req: Request, res: Response) {
    try {
      const body = { ...req.body };
      // Normalizamos tamanoId -> tamano_id
      if (body.tamanoId && !body.tamano_id) {
        body.tamano_id = body.tamanoId;
        delete body.tamanoId;
      }

      if (typeof body.tamano_id !== 'number') {
        return res.status(400).json({ message: 'tamanoId (o tamano_id) es requerido y debe ser numérico' });
      }

      const caja = await CajaSeguridadController.cajaSeguridadService.createCaja(body);
      res.status(201).json(caja);
    } catch (error: any) {
      if (error?.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'El número de caja ya existe', error });
      }
      logger.error('Error al crear la caja de seguridad:', error);
      res.status(500).json({ message: 'Error al crear la caja de seguridad', error });
    }
  }

  static async updateCaja(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = { ...req.body };
      if (body.tamanoId && !body.tamano_id) {
        body.tamano_id = body.tamanoId;
        delete body.tamanoId;
      }

      const [count, updated] = await CajaSeguridadController.cajaSeguridadService.updateCaja(Number(id), body);
      if (count === 0) {
        return res.status(404).json({ message: 'Caja no encontrada' });
      }
      res.status(200).json(updated[0]);
    } catch (error: any) {
      if (error?.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'El número de caja ya existe', error });
      }
      logger.error('Error al actualizar la caja de seguridad:', error);
      res.status(500).json({ message: 'Error al actualizar la caja de seguridad', error });
    }
  }

  static async deleteCaja(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await CajaSeguridadController.cajaSeguridadService.deleteCaja(Number(id));
      if (!deleted) {
        return res.status(404).json({ message: 'Caja no encontrada' });
      }
      res.status(200).json({ message: 'Caja eliminada lógicamente', caja: deleted });
    } catch (error) {
      logger.error('Error al eliminar la caja de seguridad:', error);
      res.status(500).json({ message: 'Error al eliminar la caja de seguridad', error });
    }
  }

  static async getSociosByCaja(req: Request, res: Response) {
    try {
      const { cajaId } = req.params;
      const socios = await CajaSeguridadController.cajaSeguridadService.getSociosByCaja(Number(cajaId));
      res.status(200).json(socios);
    } catch (error) {
      logger.error('Error al obtener socios por caja:', error);
      res.status(500).json({ message: 'Error al obtener socios por caja', error });
    }
  }

  static async getCajasBySocio(req: Request, res: Response) {
    try {
      const { socioId } = req.params;
      const cajas = await CajaSeguridadController.cajaSeguridadService.getCajasBySocio(Number(socioId));
      res.status(200).json(cajas);
    } catch (error) {
      logger.error('Error al obtener cajas por socio:', error);
      res.status(500).json({ message: 'Error al obtener cajas por socio', error });
    }
  }

  static async assignSocioACaja(req: Request, res: Response) {
    const { socioId, cajaId, esTitular, fechaInicio, fechaFin, nota } = req.body;
    const socioIdNum = Number(socioId);
    const cajaIdNum = Number(cajaId);

    if (Number.isNaN(socioIdNum) || Number.isNaN(cajaIdNum)) {
      return res.status(400).json({ message: 'socioId y cajaId deben ser numéricos' });
    }

    try {
      const result = await CajaSeguridadController.cajaSeguridadService.assignSocioACaja({
        socioId: socioIdNum,
        cajaId: cajaIdNum,
        esTitular,
        fechaInicio,
        fechaFin,
        nota,
      });

      if (result?.alreadyAssigned) {
        return res.status(200).json({ message: 'El socio ya está asignado a esta caja', asignacion: result.asignacion });
      }

      res.status(201).json(result);
    } catch (error) {
      logger.error('Error al asignar socio a caja:', error);
      res.status(500).json({ message: 'Error al asignar socio a caja', error });
    }
  }

  static async unassignSocioDeCaja(req: Request, res: Response) {
    const socioId = Number((req.body && req.body.socioId) ?? req.params.socioId ?? req.query.socioId);
    const cajaId = Number((req.body && req.body.cajaId) ?? req.params.cajaId ?? req.query.cajaId);

    if (Number.isNaN(socioId) || Number.isNaN(cajaId)) {
      return res.status(400).json({ message: 'socioId y cajaId son requeridos y deben ser numéricos' });
    }

    try {
      const result = await CajaSeguridadController.cajaSeguridadService.unassignSocioDeCaja(socioId, cajaId);
      if (!result) {
        return res.status(404).json({ message: 'Asignación no encontrada' });
      }
      res.status(200).json({
        message: 'Asignación eliminada',
        socioCajaId: result.socioCajaId,
        cajaId: result.cajaId,
        socioId: result.socioId,
      });
    } catch (error: any) {
      if (error?.code === 'CAJA_UNICO_SOCIO') {
        return res.status(400).json({ message: error.message });
      }
      logger.error('Error al desasignar socio de caja:', error);
      res.status(500).json({ message: 'Error al desasignar socio de caja', error });
    }
  }
}

export default CajaSeguridadController;
