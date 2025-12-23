import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import PagosSocios from '../models/pagosSocios.models';
import logger from '../configs/logger';

const { MP_ACCESS_TOKEN, MP_NOTIFICATION_URL, MP_SUCCESS_URL, MP_FAILURE_URL } = process.env;

let mpClient: MercadoPagoConfig | null = null;
let prefClient: Preference | null = null;
let paymentClient: Payment | null = null;

if (!MP_ACCESS_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn('MP_ACCESS_TOKEN no está configurado; los pagos de Mercado Pago fallarán.');
} else {
  mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
  prefClient = new Preference(mpClient);
  paymentClient = new Payment(mpClient);
}

const mapEstado = (mpStatus: string | undefined) => {
  const status = (mpStatus || '').toLowerCase();
  if (status === 'approved') return 'pagado';
  if (status === 'rejected') return 'rechazado';
  if (status === 'refunded') return 'reintegrado';
  return 'pendiente';
};

class MercadoPagoService {
  async crearPreferencia(pagoSociosId: number) {
    if (!prefClient) {
      throw new Error('Mercado Pago no está configurado (MP_ACCESS_TOKEN faltante)');
    }

    const pago = await PagosSocios.findByPk(pagoSociosId);
    if (!pago) {
      throw new Error('Pago de socio no encontrado');
    }

    const monto = Number(pago.getDataValue('pagosSocios_monto') || 0);
    const titulo = `Pago socio #${pagoSociosId}`;

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

    const body: any = {
      items: [
        {
          id: String(pagoSociosId),
          title: titulo,
          quantity: 1,
          unit_price: monto,
          currency_id: 'ARS',
        },
      ],
      external_reference: String(pagoSociosId),
      notification_url: MP_NOTIFICATION_URL,
    };

    if (backUrls) {
      body.back_urls = backUrls;
      body.auto_return = 'approved';
    }

    const pref = await prefClient.create({ body });
    console.log('Preferencia MP creada:', pref);
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

    if (!externalRef) {
      logger.warn('Webhook MP sin external_reference', { id: event.id });
      return { handled: false };
    }

    const pago = await PagosSocios.findByPk(Number(externalRef));
    if (!pago) {
      logger.warn('Webhook MP pago no encontrado', { externalRef });
      return { handled: false };
    }

    await pago.update({
      pagosSocios_estado: mapEstado(status),
      pagosSocios_fechaPago: new Date(),
    });

    return { handled: true, status };
  }
}

export default new MercadoPagoService();
