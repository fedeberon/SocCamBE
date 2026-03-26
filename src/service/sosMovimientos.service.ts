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
  letra?: string | null;
  sucursal?: number | null;
  numero?: number | null;
  montodebe?: number | null;
  montohaber?: number | null;
  [key: string]: any;
};

class SosMovimientosService {
  private sanitizeCuit(value: string): string {
    return String(value || '').replace(/\D/g, '');
  }

  private inferTipoMovimientoFromCc(mov: MovimientoCuentaCorrienteLike): 'FACTURA' | 'RECIBO' | 'OTRO' {
    const tipoRaw = String(mov?.fcncnd || '').toUpperCase();

    if (/REC|RCB|COBRO/.test(tipoRaw)) return 'RECIBO';
    if (/FAC|FC|FACTURA|DEBITO|ND/.test(tipoRaw)) return 'FACTURA';

    const haber = Number(mov?.montohaber || 0);
    const debe = Number(mov?.montodebe || 0);
    if (haber > 0 && debe <= 0) return 'RECIBO';
    if (debe > 0 && haber <= 0) return 'FACTURA';

    return 'OTRO';
  }

  private buildComprobanteNumeroFromCc(mov: MovimientoCuentaCorrienteLike): string | null {
    const parts = [mov?.fcncnd, mov?.letra].filter(Boolean).map((v) => String(v).trim());
    const sucursal = Number(mov?.sucursal);
    const numero = Number(mov?.numero);

    if (Number.isFinite(sucursal) && Number.isFinite(numero)) {
      parts.push(`${String(sucursal).padStart(4, '0')}-${String(numero).padStart(8, '0')}`);
    } else if (Number.isFinite(numero)) {
      parts.push(String(numero));
    } else if (mov?.idcomprobante) {
      parts.push(String(mov.idcomprobante));
    }

    const comprobante = parts.join(' ').trim();
    return comprobante || null;
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
        tipo_movimiento: 'RECIBO',
        comprobante_numero: cobro?.referencia || String(sosCobroId),
        factura_referencia: cobro?.factura || null,
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

    const enriched = (movimientos || []).map((mov) => {
      const tipoMovimiento = this.inferTipoMovimientoFromCc(mov);
      const comprobanteNumero = this.buildComprobanteNumeroFromCc(mov);
      const memo = String(mov?.memo || '').trim();
      const montodebe = Number(mov?.montodebe || 0);
      const montohaber = Number(mov?.montohaber || 0);
      const fecha = mov?.fecha ? new Date(mov.fecha) : null;

      return { mov, tipoMovimiento, comprobanteNumero, memo, montodebe, montohaber, fecha };
    });

    const facturas = enriched.filter(
      (x) => x.tipoMovimiento === 'FACTURA' && x.comprobanteNumero && x.montodebe > 0,
    );

    const matchFacturaForRecibo = (recibo: (typeof enriched)[number]): string | null => {
      const memo = recibo.memo;
      const amount = recibo.montohaber;
      const fechaRecibo = recibo.fecha ? recibo.fecha.getTime() : Number.MAX_SAFE_INTEGER;

      const byMemo = memo
        ? facturas.filter((f) => f.memo && f.memo.toLowerCase() === memo.toLowerCase())
        : [];

      if (byMemo.length === 1) return byMemo[0].comprobanteNumero || null;
      if (byMemo.length > 1) {
        byMemo.sort((a, b) => {
          const da = Math.abs((a.fecha ? a.fecha.getTime() : fechaRecibo) - fechaRecibo);
          const db = Math.abs((b.fecha ? b.fecha.getTime() : fechaRecibo) - fechaRecibo);
          return da - db;
        });
        return byMemo[0].comprobanteNumero || null;
      }

      const byAmount = facturas.filter((f) => Math.abs(f.montodebe - amount) <= 1);
      if (byAmount.length === 1) return byAmount[0].comprobanteNumero || null;
      if (byAmount.length > 1) {
        byAmount.sort((a, b) => {
          const da = Math.abs((a.fecha ? a.fecha.getTime() : fechaRecibo) - fechaRecibo);
          const db = Math.abs((b.fecha ? b.fecha.getTime() : fechaRecibo) - fechaRecibo);
          return da - db;
        });
        return byAmount[0].comprobanteNumero || null;
      }

      return memo || null;
    };

    for (const row of enriched) {
      const { mov, tipoMovimiento, comprobanteNumero, memo } = row;
      const sosCobroId = Number(mov?.idcomprobante || 0) || null;
      const montodebe = mov?.montodebe ?? null;
      const montohaber = mov?.montohaber ?? null;
      const monto = Number(montohaber || 0) > 0 ? montohaber : montodebe;

      const facturaReferencia =
        tipoMovimiento === 'RECIBO'
          ? matchFacturaForRecibo(row)
          : null;

      const payload = {
        socio_id: socioId,
        sos_cobro_id: sosCobroId,
        sos_cliente_id: mov?.idclipro ? Number(mov.idclipro) : null,
        cuit_cuil: cleanCuit,
        cliente_nombre: mov?.clipro || null,
        cliente_email: null,
        fecha: mov?.fecha ? new Date(mov.fecha) : null,
        factura: mov?.fcncnd || null,
        tipo_movimiento: tipoMovimiento,
        comprobante_numero: comprobanteNumero,
        factura_referencia: facturaReferencia,
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
