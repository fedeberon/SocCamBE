import { Request, Response } from 'express';
import logger from '../configs/logger';
import TipoSocioService from '../service/tipoSocio.service';
import { ITipoSocioService } from '../interfaces/ItipoSocio.service';

class TipoSocioController {
  private static tipoSocioService: ITipoSocioService = new TipoSocioService();

  static async getTipoSocios(req: Request, res: Response) {
    try {
      const tipoSocios = await TipoSocioController.tipoSocioService.getAllTipoSocios();
      res.status(200).json(tipoSocios);
    } catch (error) {
      logger.error('Error al obtener los tipos de socio:', error);
      res.status(500).json({ message: 'Error al obtener los tipos de socio', error });
    }
  }

  static async getTipoSocioById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tipoSocio = await TipoSocioController.tipoSocioService.getTipoSocioById(Number(id));
      if (tipoSocio) {
        res.status(200).json(tipoSocio);
      } else {
        res.status(404).json({ message: 'Tipo de socio no encontrado' });
      }
    } catch (error) {
      logger.error('Error al obtener el tipo de socio:', error);
      res.status(500).json({ message: 'Error al obtener el tipo de socio', error });
    }
  }

    static async createTipoSocio(req: Request, res: Response) {
        try {
        const tipoSocioData = req.body;
        const newTipoSocio = await TipoSocioController.tipoSocioService.createTipoSocio(tipoSocioData);
        res.status(201).json(newTipoSocio);
        } catch (error) {
        logger.error('Error al crear el tipo de socio:', error);
        res.status(500).json({ message: 'Error al crear el tipo de socio', error });
        }
    }

    static async updateTipoSocio(req: Request, res: Response) {
        try {
        const { id } = req.params;
        const tipoSocioData = req.body;
        const [updatedCount, updatedTipoSocios] = await TipoSocioController.tipoSocioService.updateTipoSocio(Number(id), tipoSocioData);
        if (updatedCount > 0) {
            res.status(200).json(updatedTipoSocios[0]);
        } else {
            res.status(404).json({ message: 'Tipo de socio no encontrado' });
        }
        } catch (error) {
        logger.error('Error al actualizar el tipo de socio:', error);
        res.status(500).json({ message: 'Error al actualizar el tipo de socio', error });
        }
    }

    static async deleteTipoSocio(req: Request, res: Response) {
        try {
        const { id } = req.params;
        const deletedCount = await TipoSocioController.tipoSocioService.deleteTipoSocio(Number(id));
        if (deletedCount > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Tipo de socio no encontrado' });
        }
        } catch (error) {
        logger.error('Error al eliminar el tipo de socio:', error);
        res.status(500).json({ message: 'Error al eliminar el tipo de socio', error });
        }
    }

  // Additional methods for create, update, and delete can be added here
}

export default TipoSocioController;