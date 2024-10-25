export interface IMovimientoCuentaCorrienteCofreService {
  getAllMovimientos(): Promise<any[]>;
  getMovimientoById(id: number): Promise<any | null>;
  getMovimientosByClienteId(clienteId: number): Promise<any[]>;
  getMovimientosByFecha(fecha: Date): Promise<any[]>;
  getMovimientoWithPagos(clienteId: number): Promise<any>;
}
