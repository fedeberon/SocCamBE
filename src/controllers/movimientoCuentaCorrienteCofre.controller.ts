import { Request, Response } from 'express';
import MovimientoCuentaCorrienteCofreService from '../service/movimientoCuentaCorrienteCofre.service';

export const getMovimientos = async (req: Request, res: Response) => {
  try {
    const movimientos = await MovimientoCuentaCorrienteCofreService.getAllMovimientos();
    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener movimientos', error });
  }
};

export const getMovimientoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movimiento = await MovimientoCuentaCorrienteCofreService.getMovimientoById(Number(id));
    if (movimiento) {
      res.json(movimiento);
    } else {
      res.status(404).json({ message: 'Movimiento no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el movimiento', error });
  }
};

export const getMovimientosByClienteId = async (req: Request, res: Response) => {
  try {
    const { clienteId } = req.params;
    const movimientos = await MovimientoCuentaCorrienteCofreService.getMovimientosByClienteId(Number(clienteId));
    if (movimientos.length > 0) {
      res.json(movimientos);
    } else {
      res.status(404).json({ message: 'No se encontraron movimientos para este cliente' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los movimientos por cliente', error });
  }
};

export const getMovimientosByFecha = async (req: Request, res: Response) => {
  try {
    const { fecha } = req.params;
    const movimientos = await MovimientoCuentaCorrienteCofreService.getMovimientosByFecha(new Date(fecha));
    if (movimientos.length > 0) {
      res.json(movimientos);
    } else {
      res.status(404).json({ message: 'No se encontraron movimientos para esta fecha' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los movimientos por fecha', error });
  }
};

export const getMovimientoWithPagos = async (req: Request, res: Response) => {
    try {
      const { clienteId } = req.params;
      const data = await MovimientoCuentaCorrienteCofreService.getMovimientoWithPagos(Number(clienteId));
      
      if (data.movimientos.length > 0 || data.pagos.length > 0) {
        res.json(data);
      } else {
        res.status(404).json({ message: 'No se encontraron registros para este cliente' });
      }
    } catch (error) {
      res.status(500).json({ 
        message: 'Error al obtener los movimientos y pagos del cliente', 
        error 
      });
    }
  };

