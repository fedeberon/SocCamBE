import { Request, Response } from 'express';
import logger from '../configs/logger';
import ContratoCofresService from '../service/contratoCofres.service';
import { IContratoCofresService } from '../interfaces/IcontratoCofres.service';

class ContratoCofresController {
  private static contratoCofresService: IContratoCofresService = new ContratoCofresService();

  static async getContratoCofres(req: Request, res: Response) {
    try {
      const contratoCofres = await ContratoCofresController.contratoCofresService.getAllContratoCofres();
      res.status(200).json(contratoCofres);
    } catch (error) {
      logger.error('Error al obtener los contratos de cofres:', error);
      res.status(500).json({ message: 'Error al obtener los contratos de cofres', error });
    }
  }

  static async getContratoCofresById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const contratoCofres = await ContratoCofresController.contratoCofresService.getContratoCofresById(Number(id));
      if (contratoCofres) {
        res.status(200).json(contratoCofres);
      } else {
        res.status(404).json({ message: 'Contrato de cofre no encontrado' });
      }
    } catch (error) {
      logger.error('Error al obtener el contrato de cofre:', error);
      res.status(500).json({ message: 'Error al obtener el contrato de cofre', error });
    }
  }

  static async getContratoCofressBySocioId(req: Request, res: Response) {
    try {
      const { socioId } = req.params;
      const contratoCofres = await ContratoCofresController.contratoCofresService.getContratoCofressBySocioId(Number(socioId));
      if (contratoCofres.length > 0) {
        res.status(200).json(contratoCofres);
      } else {
        res.status(404).json({ message: 'No se encontraron contratos de cofre para este socio' });
      }
    } catch (error) {
      logger.error('Error al obtener los contratos de cofre por socio:', error);
      res.status(500).json({ message: 'Error al obtener los contratos de cofre por socio', error });
    }
  }
}

export default ContratoCofresController;