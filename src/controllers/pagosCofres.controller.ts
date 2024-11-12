import { Request, Response } from 'express';
import logger from '../configs/logger';
import PagosCofresService from '../service/pagosCofres.service';

export const getAllPagosCofres = async (req: Request, res: Response) => {
  try {
    const pagosCofres = await PagosCofresService.getAllPagosCofres();
    res.json(pagosCofres);
  } catch (error) {
    logger.error('Error al obtener pagos de cofres', error)
    res.status(500).json({ message: 'Error al obtener pagos de cofres', error });
  }
};

export const getPagosCofresById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pagoCofre = await PagosCofresService.getPagosCofresById(Number(id));
    if (pagoCofre) {
      res.json(pagoCofre);
    } else {
      res.status(404).json({ message: 'Pago de cofre no encontrado' });
    }
  } catch (error) {
    logger.error('Error al obtener pagos de cofres', error)
    res.status(500).json({ message: 'Error al obtener el pago de cofre', error });
  }
};

export const getPagosCofresByContrato = async (req: Request, res: Response) => {
  try {
    const { contratoId } = req.params;
    const pagosCofres = await PagosCofresService.getPagosCofresByContrato(Number(contratoId));
    if (pagosCofres.length > 0) {
      res.json(pagosCofres);
    } else {
      res.status(404).json({ message: 'No se encontraron pagos para este contrato' });
    }
  } catch (error) {
    logger.error('Error al obtener pagos de cofres', error)
    res.status(500).json({ message: 'Error al obtener los pagos del contrato', error });
  }
};
