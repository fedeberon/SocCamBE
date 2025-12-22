import { Request, Response } from 'express';
import logger from '../configs/logger';
import DashboardService from '../service/dashboard.service';

class DashboardController {
  static async resumenCajas(req: Request, res: Response) {
    try {
      const data = await DashboardService.resumenCajas();
      res.status(200).json(data);
    } catch (error) {
      logger.error('Error al obtener resumen de cajas', error);
      res.status(500).json({ message: 'Error al obtener resumen de cajas', error });
    }
  }

  static async ocupacionPorTamano(req: Request, res: Response) {
    try {
      const data = await DashboardService.ocupacionPorTamano();
      res.status(200).json(data);
    } catch (error) {
      logger.error('Error al obtener ocupación por tamaño', error);
      res.status(500).json({ message: 'Error al obtener ocupación por tamaño', error });
    }
  }

  static async porcentajeDeuda(req: Request, res: Response) {
    try {
      const anio = req.query.anio ? Number(req.query.anio) : undefined;
      const periodo = req.query.periodo ? Number(req.query.periodo) : undefined;
      const data = await DashboardService.porcentajeDeuda({ anio, periodo });
      res.status(200).json(data);
    } catch (error) {
      logger.error('Error al obtener porcentaje de deuda', error);
      res.status(500).json({ message: 'Error al obtener porcentaje de deuda', error });
    }
  }

  static async deudaPorMes(req: Request, res: Response) {
    const anio = Number(req.params.anio);
    if (Number.isNaN(anio)) {
      return res.status(400).json({ message: 'anio debe ser numérico' });
    }

    try {
      const data = await DashboardService.deudaPorMes(anio);
      res.status(200).json(data);
    } catch (error) {
      logger.error('Error al obtener deuda por mes', error);
      res.status(500).json({ message: 'Error al obtener deuda por mes', error });
    }
  }
}

export default DashboardController;
