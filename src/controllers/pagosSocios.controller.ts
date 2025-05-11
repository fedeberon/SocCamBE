import { Request, Response } from 'express';
import logger from '../configs/logger';
import PagosSociosService from '../service/pagosSocios.service';
import deudaService from '../service/deuda.service';


export const getAllPagosSocios = async (req: Request, res: Response) => {
  try {
    const pagosSocios = await PagosSociosService.getAllPagosSocios();
    res.json(pagosSocios);
  } catch (error) {
    logger.error('Error al obtener pagos de socios', error)
    res.status(500).json({ message: 'Error al obtener pagos de socios', error });
  }
};

export const getDeudaBySocio = async (req: Request, res : Response) => {
  try {
    const { socioId } = req.params;
    const deuda_socio = await deudaService.getDeudaSociosById(Number(socioId));
    const deuda_cofres = await deudaService.getDeudaCofreById(Number(socioId));

    res.json({'deuda_socio':deuda_socio, 'deuda_cofres': deuda_cofres, 'deuda_total': (deuda_socio + deuda_cofres)});
  } catch (error) {
    logger.error('Error al obtener la deuda del socio', error)
    res.status(500).json({ message: 'Error al obtener la deuda del socio', error });
  }
}

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
    logger.error('Error al obtener pagos de socios', error)
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
    logger.error('Error al obtener pagos de socios', error)
    res.status(500).json({ message: 'Error al obtener los pagos del socio', error });
  }
};