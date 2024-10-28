import { Request, Response } from 'express';
import logger from '../configs/logger';
import AcontecimientoService from '../service/acontecimiento.service';
import { IAcontecimientoService } from '../interfaces/Iacontecimiento.service';

class AcontecimientoController {
  private static acontecimientoService: IAcontecimientoService = new AcontecimientoService();

  static async getAcontecimientos(req: Request, res: Response) {
    try {
      const acontecimientos = await AcontecimientoController.acontecimientoService.getAllAcontecimientos();
      res.status(200).json(acontecimientos);
    } catch (error) {
      logger.error('Error al obtener los acontecimientos:', error);
      res.status(500).json({ message: 'Error al obtener los acontecimientos', error });
    }
  }

  static async getAcontecimientoById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const acontecimiento = await AcontecimientoController.acontecimientoService.getAcontecimientoById(Number(id));
      if (acontecimiento) {
        res.status(200).json(acontecimiento);
      } else {
        res.status(404).json({ message: 'Acontecimiento no encontrado' });
      }
    } catch (error) {
      logger.error('Error al obtener el acontecimiento:', error);
      res.status(500).json({ message: 'Error al obtener el acontecimiento', error });
    }
  }

  static async getAcontecimientosBySocio(req: Request, res: Response) {
    try {
      const { socioId } = req.params;
      const acontecimientos = await AcontecimientoController.acontecimientoService.getAcontecimientosBySocio(Number(socioId));
      res.status(200).json(acontecimientos);
    } catch (error) {
      logger.error('Error al obtener acontecimientos por socio:', error);
      res.status(500).json({ message: 'Error al obtener acontecimientos por socio', error });
    }
  }
}

export default AcontecimientoController;
