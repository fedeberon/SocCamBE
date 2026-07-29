import { Request, Response } from 'express';
import logger from '../configs/logger';
import MovimientoCuentaCorrienteCofreService from '../service/movimientoCuentaCorrienteCofre.service';
import { IMovimientoCuentaCorrienteCofreService } from '../interfaces/IMovimientoCuentaCorrienteCofre.service';
import { buildFacturaPdf } from '../utils/facturaPdf';

class MovimientoCuentaCorrienteCofreController {
  private static movimientoService: IMovimientoCuentaCorrienteCofreService = new MovimientoCuentaCorrienteCofreService();

  static async getMovimientos(req: Request, res: Response) {
    try {
      const movimientos = await MovimientoCuentaCorrienteCofreController.movimientoService.getAllMovimientos();
      res.status(200).json(movimientos);
    } catch (error) {
      logger.error('Error al obtener movimientos:', error);
      res.status(500).json({ message: 'Error al obtener movimientos', error });
    }
  }

  static async getMovimientoById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const movimiento = await MovimientoCuentaCorrienteCofreController.movimientoService.getMovimientoById(Number(id));
      if (movimiento) {
        res.status(200).json(movimiento);
      } else {
        res.status(404).json({ message: 'Movimiento no encontrado' });
      }
    } catch (error) {
      logger.error('Error al obtener el movimiento:', error);
      res.status(500).json({ message: 'Error al obtener el movimiento', error });
    }
  }

  static async getMovimientosByClienteId(req: Request, res: Response) {
    try {
      const { clienteId } = req.params;
      const movimientos = await MovimientoCuentaCorrienteCofreController.movimientoService.getMovimientosByClienteId(Number(clienteId));
      if (movimientos.length > 0) {
        res.status(200).json(movimientos);
      } else {
        res.status(404).json({ message: 'No se encontraron movimientos para este cliente' });
      }
    } catch (error) {
      logger.error('Error al obtener los movimientos por cliente:', error);
      res.status(500).json({ message: 'Error al obtener los movimientos por cliente', error });
    }
  }

  static async getMovimientosByFecha(req: Request, res: Response) {
    try {
      const { fecha } = req.params;
      const movimientos = await MovimientoCuentaCorrienteCofreController.movimientoService.getMovimientosByFecha(new Date(fecha));
      if (movimientos.length > 0) {
        res.status(200).json(movimientos);
      } else {
        res.status(404).json({ message: 'No se encontraron movimientos para esta fecha' });
      }
    } catch (error) {
      logger.error('Error al obtener los movimientos por fecha:', error);
      res.status(500).json({ message: 'Error al obtener los movimientos por fecha', error });
    }
  }

  static async getMovimientoWithPagos(req: Request, res: Response) {
    try {
      const { clienteId } = req.params;
      const data = await MovimientoCuentaCorrienteCofreController.movimientoService.getMovimientoWithPagos(Number(clienteId));
      
      if (data.movimientos.length > 0 || data.pagos.length > 0) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ message: 'No se encontraron registros para este cliente' });
      }
    } catch (error) {
      logger.error('Error al obtener los movimientos y pagos del cliente:', error);
      res.status(500).json({ message: 'Error al obtener los movimientos y pagos del cliente', error });
    }
  }

  static async getResumenBySocioId(req: Request, res: Response) {
    try {
      const socioId = Number(req.params.socioId);
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      if (Number.isNaN(socioId)) {
        return res.status(400).json({ message: 'socioId debe ser numérico' });
      }

      const data = await MovimientoCuentaCorrienteCofreController.movimientoService.getResumenBySocioId(socioId, limit);
      return res.status(200).json(data);
    } catch (error) {
      logger.error('Error al obtener resumen de cofres por socio:', error);
      return res.status(500).json({ message: 'Error al obtener resumen de cofres por socio', error });
    }
  }

  static async generarFacturaPdf(req: Request, res: Response) {
    try {
      const { fecha, documento, comprobante, detalle, tipo, movimiento, importe, saldo, estado, socioNombre, socioId } = req.body;

      const pdf = buildFacturaPdf({
        fecha,
        documento,
        comprobante,
        detalle,
        tipo,
        movimiento,
        importe: Number(importe || 0),
        saldo: Number(saldo || 0),
        estado,
        socioNombre,
        socioId: socioId ? Number(socioId) : undefined,
      });

      const compSafe = (comprobante || 'movimiento').replace(/[^a-zA-Z0-9-_]/g, '_');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="movimiento-${compSafe}.pdf"`);
      return res.status(200).send(pdf);
    } catch (error) {
      logger.error('Error al generar PDF de factura:', error);
      return res.status(500).json({ message: 'Error al generar el PDF' });
    }
  }
}

export default MovimientoCuentaCorrienteCofreController;
