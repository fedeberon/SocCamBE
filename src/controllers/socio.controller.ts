import { Request, Response } from 'express';
import logger from '../configs/logger';
import SocioService from '../service/socio.service';
import { ISocioService } from '../interfaces/Isocio.service';

class SocioController {
  private static socioService: ISocioService = new SocioService(); 

  static async getSocios(req: Request, res: Response) {
    try {
      const socios = await SocioController.socioService.getAllSocios();
      res.status(200).json(socios);
    } catch (error) {
      logger.error('Error al obtener los socios:', error);
      res.status(500).json({ message: 'Error al obtener los socios', error });
    }
  }

  static async getSocioById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const socio = await SocioController.socioService.getSocioById(Number(id));
      if (socio) {
        res.status(200).json(socio);
      } else {
        res.status(404).json({ message: 'Socio no encontrado' });
      }
    } catch (error) {
      logger.error('Error al obtener el socio:', error);
      res.status(500).json({ message: 'Error al obtener el socio', error });
    }
  }

  static async getSociosByEmail(req: Request, res: Response) {
    try {
      const { email } = req.params;
      const socios = await SocioController.socioService.getSociosByEmail(email);
      if (socios.length > 0) {
        res.status(200).json(socios);
      } else {
        res.status(404).json({ message: 'No se encontraron socios para este correo' });
      }
    } catch (error) {
      logger.error('Error al obtener los socios por correo:', error);
      res.status(500).json({ message: 'Error al obtener los socios por correo', error });
    }
  }

  static async getSociosByMatricula(req: Request, res: Response) {
    try {
      const { matricula } = req.params;
      const socios = await SocioController.socioService.getSociosByMatricula(Number(matricula));
      if (socios.length > 0) {
        res.status(200).json(socios);
      } else {
        res.status(404).json({ message: 'No se encontraron socios para esta matrícula' });
      }
    } catch (error) {
      logger.error('Error al obtener los socios por matrícula:', error);
      res.status(500).json({ message: 'Error al obtener los socios por matrícula', error });
    }
  }

  static async getSocioWithPagos(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const socioWithPagos = await SocioController.socioService.getSocioWithPagos(Number(id));
      if (socioWithPagos) {
        res.status(200).json(socioWithPagos);
      } else {
        res.status(404).json({ message: 'Socio no encontrado' });
      }
    } catch (error) {
      logger.error('Error al obtener el socio con sus pagos:', error);
      res.status(500).json({ message: 'Error al obtener el socio con sus pagos', error });
    }
  }
}

export default SocioController;
