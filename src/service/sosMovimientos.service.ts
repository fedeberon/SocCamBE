import SosMovimiento from '../models/sosMovimiento.models';

type PagoSosLike = {
  sos_cobro?: {
    id?: number;
    fecha?: string;
    factura?: string;
    montototal?: number;
    referencia?: string;
    cliente?: {
      id?: number;
      cuit?: string;
      clipro?: string;
      email?: string;
    };
    [key: string]: any;
  };
};

type MovimientoCuentaCorrienteLike = {
  idcomprobante?: string | number;
  idclipro?: string | number;
  fecha?: string;
  clipro?: string;
  memo?: string | null;
  fcncnd?: string | null;
  numero?: number | null;
  montodebe?: number | null;
  montohaber?: number | null;
  [key: string]: any;
};

class SosMovimientosService {
  private sanitizeCuit(value: string): string {
    return String(value || '').replace(/\D/g, '');
  }

  async upsertFromPagosSos(socioId: number, pagosSos: PagoSosLike[], periodo: string) {
    for (const pago of pagosSos || []) {
      const cobro = pago?.sos_cobro;
      if (!cobro) continue;

      const sosCobroId = cobro?.id || null;
      const cliente = cobro?.cliente || null;
      const cuit = this.sanitizeCuit(cliente?.cuit || '');

      if (!sosCobroId || !cuit) {
        continue;
      }

      const payload = {
        socio_id: socioId,
        sos_cobro_id: sosCobroId,
        sos_cliente_id: cliente?.id || null,
        cuit_cuil: cuit,
        cliente_nombre: cliente?.clipro || null,
        cliente_email: cliente?.email || null,
        fecha: cobro?.fecha ? new Date(cobro.fecha) : null,
        factura: cobro?.factura || null,
        referencia: cobro?.referencia || null,
        monto: cobro?.montototal ?? null,
        periodo: periodo || null,
        raw_json: JSON.stringify(cobro),
        source: 'SOS_CONTADOR',
        deleted: false,
        updated_at: new Date(),
      } as any;

      const existing = await SosMovimiento.findOne({
        where: {
          socio_id: socioId,
          sos_cobro_id: sosCobroId,
        },
      });

      if (existing) {
        await existing.update(payload);
      } else {
        await SosMovimiento.create(payload);
      }
    }
  }

  async upsertFromCuentaCorriente(
    socioId: number,
    cuit: string,
    movimientos: MovimientoCuentaCorrienteLike[],
    periodo: string,
  ) {
    const cleanCuit = this.sanitizeCuit(cuit);

    for (const mov of movimientos || []) {
      const sosCobroId = Number(mov?.idcomprobante || 0) || null;
      const montodebe = mov?.montodebe ?? null;
      const montohaber = mov?.montohaber ?? null;
      const monto = Number(montohaber || 0) > 0 ? montohaber : montodebe;

      const payload = {
        socio_id: socioId,
        sos_cobro_id: sosCobroId,
        sos_cliente_id: mov?.idclipro ? Number(mov.idclipro) : null,
        cuit_cuil: cleanCuit,
        cliente_nombre: mov?.clipro || null,
        cliente_email: null,
        fecha: mov?.fecha ? new Date(mov.fecha) : null,
        factura: mov?.fcncnd || null,
        referencia: mov?.memo || null,
        monto: monto ?? null,
        montodebe: montodebe ?? null,
        montohaber: montohaber ?? null,
        periodo: periodo || null,
        raw_json: JSON.stringify(mov),
        source: 'SOS_CONTADOR_CC',
        deleted: false,
        updated_at: new Date(),
      } as any;

      if (sosCobroId) {
        const existing = await SosMovimiento.findOne({
          where: {
            socio_id: socioId,
            sos_cobro_id: sosCobroId,
          },
        });

        if (existing) {
          await existing.update(payload);
        } else {
          await SosMovimiento.create(payload);
        }
      } else {
        await SosMovimiento.create(payload);
      }
    }
  }
}

export default new SosMovimientosService();
