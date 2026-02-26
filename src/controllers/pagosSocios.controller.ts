import { Request, Response } from 'express';
import logger from '../configs/logger';
import PagosSociosService from '../service/pagosSocios.service';
import deudaService from '../service/deuda.service';
import Socio from '../models/socio.models';
import PagosSociosAdapter from '../adapters/PagosSociosAdapter';
import SosMovimiento from '../models/sosMovimiento.models';


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

    const movimientos = await SosMovimiento.findAll({
      where: {
        socio_id: Number(socioId),
        cuit_cuil: socioCuit,
        deleted: false,
      },
      order: [['fecha', 'DESC'], ['sos_mov_id', 'DESC']],
    });

    if (!movimientos.length) {
      return res.status(404).json({ message: 'No hay pagos sincronizados para el socio. Ejecutá la sync y reintentá.' });
    }

    const cobros = movimientos.map((m: any) => {
      const raw = (() => {
        try {
          return m?.raw_json ? JSON.parse(m.raw_json) : null;
        } catch {
          return null;
        }
      })();

      return {
        id: m.sos_cobro_id || m.sos_mov_id,
        fecha: m.fecha,
        factura: m.factura,
        montototal: Number(m.monto || 0),
        referencia: m.referencia,
        cliente: {
          id: m.sos_cliente_id,
          cuit: m.cuit_cuil,
          clipro: m.cliente_nombre,
          email: m.cliente_email,
        },
        ...(raw || {}),
      };
    });

    const pagos = PagosSociosAdapter.fromSosCobros(cobros as any[], Number(socioId), periodo);

    return res.json(pagos);
  } catch (error) {
    logger.error('Error al obtener pagos de socios', error)
    return res.status(500).json({ message: 'Error al obtener los pagos del socio', error });
  }
};

export const getSociosSosByCuit = async (_req: Request, res: Response) => {
  return res.status(410).json({
    message: 'Endpoint deshabilitado: el backend ya no consulta SOS Contador en línea. Usar datos sincronizados por worker.',
  });
};
