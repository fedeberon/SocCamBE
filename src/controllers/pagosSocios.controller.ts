import { Request, Response } from 'express';
import logger from '../configs/logger';
import deudaService from '../service/deuda.service';
import sosContadorService from '../service/sosContador.service';
import Socio from '../models/socio.models';
import PagosSocios from '../models/pagosSocios.models';
import PagosSociosAdapter from '../adapters/PagosSociosAdapter';
import SosMovimiento from '../models/sosMovimiento.models';

const mapMovimientoToPago = (m: any) => ({
  id: m.sos_mov_id,
  socio_id: m.socio_id,
  sos_cobro_id: m.sos_cobro_id,
  cuit: m.cuit_cuil,
  fecha: m.fecha,
  factura: m.factura,
  tipo_movimiento: m.tipo_movimiento,
  comprobante_numero: m.comprobante_numero,
  factura_referencia: m.factura_referencia,
  referencia: m.referencia,
  monto: Number(m.monto || 0),
  montodebe: Number(m.montodebe || 0),
  montohaber: Number(m.montohaber || 0),
  periodo: m.periodo,
  source: m.source,
});

export const getAllPagosSocios = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit || 200), 1000);
    const movimientos = await SosMovimiento.findAll({
      where: { deleted: false },
      attributes: { exclude: ['raw_json'] },
      order: [['fecha', 'DESC'], ['sos_mov_id', 'DESC']],
      limit,
    });

    res.json(movimientos.map((m: any) => mapMovimientoToPago(m)));
  } catch (error) {
    logger.error('Error al obtener pagos de socios (tabla SOS local)', error)
    res.status(500).json({ message: 'Error al obtener pagos de socios', error });
  }
};

export const getDeudaBySocio = async (req: Request, res : Response) => {
  try {
    const { socioId } = req.params;
    const socio = await Socio.findByPk(Number(socioId));
    const socioData = socio ? (socio.get({ plain: true }) as any) : null;
    const socioCuit = String(socioData?.socio_cuit || '').replace(/\D/g, '');
    const deuda_socio = await deudaService.getDeudaSociosById(Number(socioId), socioCuit || undefined);

    const pagosLocales = await PagosSocios.findAll({
      where: { pagosSocios_socio: Number(socioId), pagosSocios_deleted: false },
      order: [['pagosSocios_fechaVencimiento', 'DESC']],
    });

    res.json({ deuda_socio, deuda_cofres: 0, deuda_total: deuda_socio, pagos_locales: pagosLocales });
  } catch (error) {
    logger.error('Error al obtener la deuda del socio', error)
    res.status(500).json({ message: 'Error al obtener la deuda del socio', error });
  }
}

export const getPagosSociosById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movimiento = await SosMovimiento.findOne({
      where: {
        sos_mov_id: Number(id),
        deleted: false,
      },
    });

    if (!movimiento) {
      return res.status(404).json({ message: 'Pago de socio no encontrado' });
    }

    return res.json(mapMovimientoToPago(movimiento as any));
  } catch (error) {
    logger.error('Error al obtener pago de socio por id (tabla SOS local)', error)
    return res.status(500).json({ message: 'Error al obtener el pago de socio', error });
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

    const pagosLocales = await PagosSocios.findAll({
      where: { pagosSocios_socio: Number(socioId) },
      order: [['pagosSocios_fechaVencimiento', 'DESC']],
    });

    let cobrosSos: any[] = [];
    if (socioCuit) {
      const movimientos = await SosMovimiento.findAll({
        where: {
          socio_id: Number(socioId),
          cuit_cuil: socioCuit,
          deleted: false,
        },
        attributes: { exclude: ['raw_json'] },
        order: [['fecha', 'DESC'], ['sos_mov_id', 'DESC']],
      });

      cobrosSos = movimientos.map((m: any) => {
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
          tipo_movimiento: m.tipo_movimiento,
          comprobante_numero: m.comprobante_numero,
          factura_referencia: m.factura_referencia,
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
    }

    const pagosSos = PagosSociosAdapter.fromSosCobros(cobrosSos as any[], Number(socioId), periodo);

    return res.json({
      socioId: Number(socioId),
      pagos_locales: pagosLocales,
      pagos_sos: pagosSos,
      movimientos_sos: cobrosSos,
    });
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
