import { Request, Response } from 'express';
import MercadoPagoService from '../service/mercadoPago.service';
import logger from '../configs/logger';

class MercadoPagoController {
  static async crearPreferencia(req: Request, res: Response) {
    const { pagoId } = req.body || {};
    if (!pagoId) {
      return res.status(400).json({ message: 'pagoId es requerido' });
    }
    try {
      const pref = await MercadoPagoService.crearPreferencia(Number(pagoId));
      res.status(201).json(pref);
    } catch (error) {
      logger.error('Error al crear preferencia MP', error);
      res.status(500).json({ message: 'Error al crear preferencia de pago', error });
    }
  }

  static async webhook(req: Request, res: Response) {
    try {
      const { id, type, topic } = req.query;
      const bodyId = (req.body && (req.body.data?.id || req.body.id)) as string | undefined;
      const event = {
        id: (id as string) || bodyId,
        type: type as string,
        topic: topic as string,
      };

      const result = await MercadoPagoService.procesarWebhook(event);
      if (!result.handled) {
        return res.status(200).json({ message: 'Evento ignorado' });
      }
      res.status(200).json({ message: 'OK', status: result.status });
    } catch (error) {
      logger.error('Error en webhook de MP', error);
      res.status(500).json({ message: 'Error al procesar webhook de Mercado Pago', error });
    }
  }

  static async retorno(req: Request, res: Response) {
    try {
      const paymentId = req.query.payment_id as string | undefined;
      const status = req.query.status as string | undefined;
      const externalRef = req.query.external_reference as string | undefined;

      if (paymentId) {
        await MercadoPagoService.procesarWebhook({ id: paymentId, topic: 'payment' });
      }

      const redirectBase = process.env.MP_SUCCESS_URL || process.env.MP_SUCCESS_REDIRECT || '/';
      const url = new URL(redirectBase);
      if (status) url.searchParams.set('status', status);
      if (externalRef) url.searchParams.set('ref', externalRef);
      if (paymentId) url.searchParams.set('payment_id', paymentId);

      res.redirect(url.toString());
    } catch (error) {
      logger.error('Error al manejar retorno de MP', error);
      res.status(500).json({ message: 'Error al manejar retorno de Mercado Pago', error });
    }
  }

  // Endpoint para que el frontend pueda forzar el procesamiento del pago y obtener el estado
  static async procesarPago(req: Request, res: Response) {
    const paymentId = (req.body?.paymentId || req.query.paymentId || req.query.payment_id) as string | undefined;
    if (!paymentId) {
      return res.status(400).json({ message: 'paymentId es requerido' });
    }

    try {
      const result = await MercadoPagoService.procesarWebhook({ id: paymentId, topic: 'payment' });
      if (!result.handled) {
        return res.status(404).json({ message: 'Pago no encontrado o no procesado' });
      }
      res.status(200).json({ message: 'Pago procesado', status: result.status });
    } catch (error) {
      logger.error('Error al procesar pago desde frontend', error);
      res.status(500).json({ message: 'Error al procesar pago', error });
    }
  }
}

export default MercadoPagoController;
