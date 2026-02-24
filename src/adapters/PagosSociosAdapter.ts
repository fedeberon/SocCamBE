type SosCobroCliente = {
  id: number;
  cuit: string;
  clipro: string;
  email?: string;
};

type SosCobro = {
  id: number;
  fecha?: string;
  factura?: string;
  montototal?: number;
  referencia?: string;
  cliente?: SosCobroCliente | null;
  [key: string]: any;
};

class PagosSociosAdapter {
  static fromSosCobro(cobro: SosCobro, socioId: number, periodicidad: string) {
    const fecha = cobro?.fecha ? new Date(cobro.fecha) : null;

    return {
      pagosSocios_id: cobro.id,
      pagosSocios_socio: socioId,
      pagosSocios_plan: cobro.factura || null,
      pagosSocios_anio: fecha ? fecha.getUTCFullYear() : null,
      pagosSocios_periodo: fecha ? fecha.getUTCMonth() + 1 : null,
      pagosSocios_periodicidad: periodicidad,
      pagosSocios_fechaVencimiento: null,
      pagosSocios_fechaPago: fecha ? fecha.toISOString() : null,
      pagosSocios_observaciones: cobro.referencia || null,
      pagosSocios_estado: 'PAGADO',
      pagosSocios_cobrador: 'SOS_CONTADOR',
      pagosSocios_monto: cobro.montototal ?? null,
      pagosSocios_deleted: false,
      pagosSocios_modificado: null,
      pagosSocios_crx_fechaVencimiento: null,
      pagosSocios_crx_fechaPago: fecha ? fecha.toISOString() : null,
      pagosSocios_operacion: null,
      recibo_id: cobro.id,
      pagosSocios_movimiento_cc: null,
      pagosSocios_bonificacion: null,
      sos_cliente: cobro.cliente || null,
      sos_cobro: cobro,
    };
  }

  static fromSosCobros(cobros: SosCobro[], socioId: number, periodicidad: string) {
    return cobros.map((cobro) => this.fromSosCobro(cobro, socioId, periodicidad));
  }
}

export default PagosSociosAdapter;
