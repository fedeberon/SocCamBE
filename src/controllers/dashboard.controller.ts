import { Request, Response } from 'express';
import logger from '../configs/logger';
import DashboardService from '../service/dashboard.service';

class DashboardController {
  static async resumenInicioSocio(req: Request, res: Response) {
    const socioId = Number(req.params.socioId);
    if (Number.isNaN(socioId) || socioId <= 0) {
      return res.status(400).json({ message: 'socioId debe ser numérico y mayor a 0' });
    }

    try {
      const data = await DashboardService.resumenInicioSocio(socioId);
      return res.status(200).json(data);
    } catch (error) {
      logger.error('Error al obtener resumen de inicio por socio', error);
      return res.status(500).json({ message: 'Error al obtener resumen de inicio por socio', error });
    }
  }

  static async resumenSocios(req: Request, res: Response) {
    try {
      const data = await DashboardService.resumenSocios();
      res.status(200).json(data);
    } catch (error) {
      logger.error('Error al obtener resumen de socios', error);
      res.status(500).json({ message: 'Error al obtener resumen de socios', error });
    }
  }

  static async sociosPorCategoria(req: Request, res: Response) {
    try {
      const data = await DashboardService.sociosPorCategoria();
      res.status(200).json(data);
    } catch (error) {
      logger.error('Error al obtener socios por categoría', error);
      res.status(500).json({ message: 'Error al obtener socios por categoría', error });
    }
  }

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

  static async pagoVsImpagoPorMes(req: Request, res: Response) {
    const anio = Number(req.params.anio);
    if (Number.isNaN(anio)) {
      return res.status(400).json({ message: 'anio debe ser numérico' });
    }

    try {
      const data = await DashboardService.pagoVsImpagoPorMes(anio);
      res.status(200).json(data);
    } catch (error) {
      logger.error('Error al obtener pagos vs impagos por mes', error);
      res.status(500).json({ message: 'Error al obtener pagos vs impagos por mes', error });
    }
  }

  static async totalRecaudado(req: Request, res: Response) {
    try {
      const data = await DashboardService.totalRecaudado();
      res.status(200).json(data);
    } catch (error) {
      logger.error('Error al obtener total recaudado', error);
      res.status(500).json({ message: 'Error al obtener total recaudado', error });
    }
  }
}

export default DashboardController;
