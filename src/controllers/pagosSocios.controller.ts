import { Request, Response } from 'express';
import PagosSociosService from '../service/pagosSocios.service';

export const getAllPagosSocios = async (req: Request, res: Response) => {
  try {
    const pagosSocios = await PagosSociosService.getAllPagosSocios();
    res.json(pagosSocios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pagos de socios', error });
  }
};

export const getPagosSociosById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pagoSocio = await PagosSociosService.getPagosSociosById(Number(id));
    if (pagoSocio) {
      res.json(pagoSocio);
    } else {
      res.status(404).json({ message: 'Pago de socio no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el pago de socio', error });
  }
};

export const getPagosSociosBySocio = async (req: Request, res: Response) => {
  try {
    const { socioId } = req.params;
    const pagosSocios = await PagosSociosService.getPagosSociosBySocio(Number(socioId));
    if (pagosSocios.length > 0) {
      res.json(pagosSocios);
    } else {
      res.status(404).json({ message: 'No se encontraron pagos para este socio' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pagos del socio', error });
  }
};