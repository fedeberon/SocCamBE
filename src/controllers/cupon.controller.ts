import { Request, Response } from 'express';
import logger from '../configs/logger';
import CuponService from '../service/cupon.service';
import { ICuponService } from '../interfaces/Icupon.service';

class CuponController {
  private static cuponService: ICuponService = new CuponService();

  static async createCupon(req: Request, res: Response) {
    try {
      const cupon = await CuponController.cuponService.createCupon(req.body);
      res.status(201).json(cupon);
    } catch (error) {
      logger.error('Error al crear el cupón:', error);
      res.status(500).json({ message: 'Error al crear el cupón', error });
    }
  }

  static async getCupones(req: Request, res: Response) {
    try {
      const cupones = await CuponController.cuponService.getCupones();
      if (cupones.length === 0) {
        return res.status(404).json({ message: 'No se encontraron cupones' });
      }
      res.status(200).json(cupones);
    } catch (error) {
      logger.error('Error al obtener los cupones:', error);
      res.status(500).json({ message: 'Error al obtener los cupones', error });
    }
  }
  
  static async getCuponesBySocio(req: Request, res: Response) {
    try {
      const { socioId } = req.params;
      const cupones = await CuponController.cuponService.getCuponesBySocio(Number(socioId));
      if (cupones.length === 0) {
        return res.status(404).json({ message: 'No se encontraron cupones para este socio' });
      }
      res.status(200).json(cupones);
    } catch (error) {
      logger.error('Error al obtener los cupones:', error);
      res.status(500).json({ message: 'Error al obtener los cupones', error });
    }
  }

  static async markAsUsed(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await CuponController.cuponService.markAsUsed(Number(id));
      if (updated) {
        res.status(200).json({ message: 'Cupón marcado como usado', cupon: updated });
      } else {
        res.status(404).json({ message: 'Cupón no encontrado' });
      }
    } catch (error) {
      logger.error('Error al marcar el cupón como usado:', error);
      res.status(500).json({ message: 'Error al marcar el cupón como usado', error });
    }
  }

  static async deleteCupon(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await CuponController.cuponService.deleteCupon(Number(id));
      if (deleted) {
        res.status(200).json({ message: 'Cupón eliminado lógicamente', cupon: deleted });
      } else {
        res.status(404).json({ message: 'Cupón no encontrado' });
      }
    } catch (error) {
      logger.error('Error al eliminar el cupón:', error);
      res.status(500).json({ message: 'Error al eliminar el cupón', error });
    }
  }

  static async assignCupon(req: Request, res: Response) {
    const { socioId, cuponId } = req.body;
    try {
      const result = await CuponController.cuponService.assignCupon(socioId, cuponId);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error asignando cupón' });
    }
  }
}

export default CuponController;
