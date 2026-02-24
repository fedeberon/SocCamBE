import { Request, Response } from 'express';
import logger from '../configs/logger';
import PagosSociosService from '../service/pagosSocios.service';
import deudaService from '../service/deuda.service';
import sosContadorService from '../service/sosContador.service';
import Socio from '../models/socio.models';
import PagosSociosAdapter from '../adapters/PagosSociosAdapter';


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

    res.json({ deuda_socio, deuda_cofres: 0, deuda_total: deuda_socio });
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
    const query = (req.query || {}) as Record<string, any>;
    const periodo = String(query.periodo || 'mes');
    const socio = await Socio.findByPk(Number(socioId));
    if (!socio) {
      return res.status(404).json({ message: 'Socio no encontrado' });
    }

    const socioData = socio.get({ plain: true }) as any;
    const socioCuit = String(socioData.socio_cuit || '').replace(/\D/g, '');
    if (!socioCuit) {
      return res.status(404).json({ message: 'El socio no tiene CUIT configurado' });
    }

    const cobros = await sosContadorService.getCobrosBySocioCuit({
      socioCuit,
      periodo: query.periodo,
      registros: query.registros,
      maxPaginas: query.maxPaginas,
    });

    if (cobros.length === 0) {
      return res.status(404).json({ message: 'No se encontraron pagos del socio en SOS Contador' });
    }

    const pagos = PagosSociosAdapter.fromSosCobros(cobros as any[], Number(socioId), periodo);

    return res.json(pagos);
  } catch (error) {
    logger.error('Error al obtener pagos de socios', error)
    return res.status(500).json({ message: 'Error al obtener los pagos del socio', error });
  }
};

export const getSociosSosByCuit = async (req: Request, res: Response) => {
  try {
    const { cuit } = req.params;
    const pagina = Number(req.query.pagina || 1);
    const registros = Number(req.query.registros || 50);
    const socioCuit = req.query.socioCuit ? String(req.query.socioCuit).replace(/\D/g, '') : '';
    const cliente = req.query.cliente !== undefined ? String(req.query.cliente).toLowerCase() === 'true' : undefined;
    const proveedor = req.query.proveedor !== undefined ? String(req.query.proveedor).toLowerCase() === 'true' : undefined;

    const response = await sosContadorService.getSociosByCuit(cuit, {
      pagina,
      registros,
      cliente,
      proveedor,
    });

    const socios = socioCuit
      ? response.items.filter((item) => String(item.cuit || '').replace(/\D/g, '') === socioCuit)
      : response.items;

    res.json({
      cuit_representado: cuit.replace(/\D/g, ''),
      pagina,
      registros,
      total_paginas: response.paginas,
      socios,
    });
  } catch (error) {
    logger.error('Error al obtener socios desde SOS Contador', error);
    res.status(500).json({ message: 'Error al obtener socios desde SOS Contador', error });
  }
};
