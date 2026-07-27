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

  private toFiniteNumber(value: any): number | null {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private resolveFacturaAsociadaIdFromCc(mov: MovimientoCuentaCorrienteLike): number | null {
    const candidates = [
      (mov as any)?.idcomprobante_asociado,
      (mov as any)?.idcomprobanteasociado,
      (mov as any)?.idcomprobante_asoc,
      (mov as any)?.idasociado,
      (mov as any)?.id_asociado,
      (mov as any)?.idfactura,
      (mov as any)?.idfactura_asociada,
      (mov as any)?.id_factura_asociada,
      (mov as any)?.idcomprobante_origen,
      (mov as any)?.id_origen,
    ];

    for (const candidate of candidates) {
      const id = this.toFiniteNumber(candidate);
      if (id && id > 0) return id;
    }

    return null;
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
    const payloads: any[] = [];

    for (const pago of pagosSos || []) {
      const cobro = pago?.sos_cobro;
      if (!cobro) continue;

      const sosCobroId = cobro?.id || null;
      const cliente = cobro?.cliente || null;
      const cuit = this.sanitizeCuit(cliente?.cuit || '');

      if (!sosCobroId || !cuit) {
        continue;
      }

      payloads.push({
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
      });
    }

    if (payloads.length === 0) return;

    await SosMovimiento.bulkCreate(payloads, {
      updateOnDuplicate: [
        'sos_cliente_id', 'cuit_cuil', 'cliente_nombre', 'cliente_email',
        'fecha', 'factura', 'tipo_movimiento', 'comprobante_numero',
        'factura_referencia', 'referencia', 'monto', 'periodo',
        'raw_json', 'source', 'deleted', 'updated_at',
      ],
    });
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

    const bySosComprobanteId = new Map<number, { comprobanteNumero: string | null }>();
    for (const row of enriched) {
      const id = this.toFiniteNumber((row.mov as any)?.idcomprobante);
      if (!id || id <= 0) continue;
      bySosComprobanteId.set(id, { comprobanteNumero: row.comprobanteNumero || null });
    }

    const upsertPayloads: any[] = [];
    const insertPayloads: any[] = [];

    for (const row of enriched) {
      const { mov, tipoMovimiento, comprobanteNumero } = row;
      const sosCobroId = Number(mov?.idcomprobante || 0) || null;
      const montodebe = mov?.montodebe ?? null;
      const montohaber = mov?.montohaber ?? null;
      const monto = Number(montohaber || 0) > 0 ? montohaber : montodebe;

      const facturaAsociadaId = tipoMovimiento === 'RECIBO' ? this.resolveFacturaAsociadaIdFromCc(mov) : null;
      const facturaReferencia =
        tipoMovimiento === 'RECIBO' && facturaAsociadaId
          ? bySosComprobanteId.get(facturaAsociadaId)?.comprobanteNumero || String(facturaAsociadaId)
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
      };

      if (sosCobroId) {
        upsertPayloads.push(payload);
      } else {
        insertPayloads.push(payload);
      }
    }

    if (upsertPayloads.length > 0) {
      await SosMovimiento.bulkCreate(upsertPayloads, {
        updateOnDuplicate: [
          'sos_cliente_id', 'cuit_cuil', 'cliente_nombre', 'cliente_email',
          'fecha', 'factura', 'tipo_movimiento', 'comprobante_numero',
          'factura_referencia', 'referencia', 'monto', 'montodebe',
          'montohaber', 'periodo', 'raw_json', 'source', 'deleted', 'updated_at',
        ],
      });
    }

    if (insertPayloads.length > 0) {
      await SosMovimiento.bulkCreate(insertPayloads);
    }
  }
}

export default new SosMovimientosService();
