import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import PagosSocios from '../models/pagosSocios.models';
import SocioCajaSeguridad from '../models/SocioCajaSeguridad.models';
import CajaSeguridad from '../models/CajaSeguridad.models';
import CajaSeguridadTamano from '../models/CajaSeguridadTamano.models';
import Servicio from '../models/Servicio.models';
import SocioServicio from '../models/SocioServicio.models';
import logger from '../configs/logger';

const { MP_ACCESS_TOKEN, MP_NOTIFICATION_URL, MP_SUCCESS_URL, MP_FAILURE_URL } = process.env;

let mpClient: MercadoPagoConfig | null = null;
let prefClient: Preference | null = null;
let paymentClient: Payment | null = null;

const initMercadoPago = () => {
  const accessToken = (MP_ACCESS_TOKEN || '').trim();
  if (!accessToken) {
    // eslint-disable-next-line no-console
    console.warn('MP_ACCESS_TOKEN no está configurado; los pagos de Mercado Pago fallarán.');
    return;
  }

  mpClient = new MercadoPagoConfig({ accessToken });
  prefClient = new Preference(mpClient);
  paymentClient = new Payment(mpClient);
};

initMercadoPago();

const mapEstado = (mpStatus: string | undefined) => {
  const status = (mpStatus || '').toLowerCase();
  if (status === 'approved') return 'pagado';
  if (status === 'rejected') return 'rechazado';
  if (status === 'refunded') return 'reintegrado';
  return 'pendiente';
};

const buildNotaPago = (prev: string | null | undefined, estado: string, paymentId?: string, externalRef?: string) => {
  const parts = [`MP ${estado}`];
  if (paymentId) parts.push(`payment ${paymentId}`);
  if (externalRef) parts.push(`ref ${externalRef}`);
  const entry = `[${new Date().toISOString()}] ${parts.join(' - ')}`;
  return prev && prev.trim() !== '' ? `${prev}\n${entry}` : entry;
};

class MercadoPagoService {
  async crearPreferencia(pagoId: number, tipo: string) {
    if (!prefClient) {
      throw new Error('Mercado Pago no está configurado (MP_ACCESS_TOKEN faltante)');
    }

    const tipoNormalized = (tipo || '').toLowerCase().trim();
    if (!tipoNormalized) {
      throw new Error('Tipo de pago no informado');
    }

    const resolvePago = async () => {
      if (tipoNormalized === 'cuota') {
        const pago = await PagosSocios.findByPk(pagoId);
        if (!pago) throw new Error('Pago de socio no encontrado');
        return {
          title: `Cuota socio #${pagoId}`,
          amount: Number(pago.getDataValue('pagosSocios_monto') || 0),
        };
      }

      if (tipoNormalized === 'caja') {
        const asignacion = await SocioCajaSeguridad.findOne({
          where: { caja_id: pagoId },
          include: [
            {
              model: CajaSeguridad,
              as: 'caja',
              include: [{ model: CajaSeguridadTamano, as: 'tamano' }],
            },
          ],
        });

        if (!asignacion) throw new Error('Caja de seguridad no encontrada para el socio');
        const caja: any = (asignacion as any).caja || {};
        const tamano: any = caja.tamano || {};
        const amount = Number(tamano.precio_mensual ?? 0);
        const numero = caja.numero || caja.caja_id || pagoId;

        return {
          title: `Caja de seguridad #${numero}`,
          amount,
        };
      }

      if (tipoNormalized === 'servicio') {
        const servicio = await Servicio.findByPk(pagoId);
        const nombre = servicio?.getDataValue('nombre') || `Servicio #${pagoId}`;
        return {
          title: nombre,
          amount: 0,
        };
      }

      throw new Error(`Tipo de pago no soportado: ${tipo}`);
    };

    const pagoInfo = await resolvePago();

    const successUrl = (MP_SUCCESS_URL || '').trim();
    const failureUrl = (MP_FAILURE_URL || '').trim();
    const backUrls =
      successUrl !== ''
        ? {
            success: successUrl,
            failure: failureUrl || successUrl,
            pending: successUrl,
          }
        : undefined;

    const externalReference = `${tipoNormalized}:${pagoId}`;

    const body: any = {
      items: [
        {
          id: String(pagoId),
          title: pagoInfo.title,
          quantity: 1,
          unit_price: pagoInfo.amount,
          currency_id: 'ARS',
        },
      ],
      external_reference: externalReference,
      notification_url: MP_NOTIFICATION_URL,
      metadata: {
        pagoId,
        tipo: tipoNormalized,
      },
    };

    if (backUrls) {
      body.back_urls = backUrls;
      body.auto_return = 'approved';
    }
    const pref = await prefClient.create({ body });

    return pref;
  }

  async procesarWebhook(event: { id?: string; type?: string; topic?: string }) {
    if (!paymentClient) {
      throw new Error('Mercado Pago no está configurado (MP_ACCESS_TOKEN faltante)');
    }

    const topic = event.topic || event.type;
    if (topic !== 'payment' || !event.id) {
      return { handled: false };
    }

    const payment = await paymentClient.get({ id: Number(event.id) });
    const data = payment;
    const externalRef = data.external_reference;
    const status = data.status;
    const metadata: any = (data as any).metadata || {};

    let refTipo = metadata.tipo as string | undefined;
    let refId = metadata.pagoId as number | undefined;

    if ((!refTipo || refId === undefined) && externalRef) {
      const [maybeTipo, maybeId] = String(externalRef).split(':');
      if (maybeTipo && maybeId) {
        refTipo = maybeTipo;
        refId = Number(maybeId);
      } else {
        refTipo = 'cuota';
        refId = Number(externalRef);
      }
    }

    if (!refTipo || refId === undefined || Number.isNaN(Number(refId))) {
      logger.warn('Webhook MP sin referencias válidas', { id: event.id, externalRef, metadata });
      return { handled: false };
    }

    const tipoNormalized = refTipo.toLowerCase();
    const estadoPago = mapEstado(status);

    if (tipoNormalized === 'cuota') {
      const pago = await PagosSocios.findByPk(Number(refId));
      if (!pago) {
        logger.warn('Webhook MP pago no encontrado', { externalRef, refId });
        return { handled: false };
      }

      await pago.update({
        pagosSocios_estado: estadoPago,
        pagosSocios_fechaPago: new Date(),
      });

      return { handled: true, status };
    }

    if (tipoNormalized === 'caja') {
      const asignaciones = await SocioCajaSeguridad.findAll({
        where: { caja_id: Number(refId) },
        order: [['socio_caja_id', 'DESC']],
      });

      if (!asignaciones.length) {
        logger.warn('Webhook MP caja no encontrada', { externalRef, refId });
        return { handled: false };
      }

      await Promise.all(
        asignaciones.map(async (asignacion) => {
          const notaActual = asignacion.getDataValue('nota') as string | null;
          const nota = buildNotaPago(notaActual, estadoPago, event.id, externalRef);
          await asignacion.update({ nota });
        }),
      );

      return { handled: true, status };
    }

    if (tipoNormalized === 'servicio') {
      const socioServicios = await SocioServicio.findAll({
        where: { servicio_id: Number(refId) },
      });

      let updates = 0;
      for (const socioServicio of socioServicios) {
        const notaActual = socioServicio.getDataValue('notas') as string | null;
        const nota = buildNotaPago(notaActual, estadoPago, event.id, externalRef);
        await socioServicio.update({ notas: nota });
        updates += 1;
      }

      if (updates === 0) {
        const servicio = await Servicio.findByPk(Number(refId));
        if (!servicio) {
          logger.warn('Webhook MP servicio no encontrado', { externalRef, refId });
          return { handled: false };
        }

        const descripcion = buildNotaPago(servicio.getDataValue('descripcion') as string | null, estadoPago, event.id, externalRef);
        await servicio.update({ descripcion });
      }

      return { handled: true, status };
    }

    logger.info('Webhook MP recibido para tipo sin update de estado', { tipo: tipoNormalized, refId, status });
    return { handled: true, status };
  }
}

export default new MercadoPagoService();
