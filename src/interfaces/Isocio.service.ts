import MovimientoCuentaCorrienteCofre from '../models/movimientoCuentaCorrienteCofre.models';

export interface ISocioService {
  getAllSocios(): Promise<any[]>; 
  getSocioById(id: number): Promise<any>;
  getSociosByEmail(email: string): Promise<any[]>;
  getSociosByMatricula(matricula: number): Promise<any[]>;
  getSocioWithPagos(id: number): Promise<any>;

  getSocioMovimientosCofre(id: number): Promise<{
    socio: any,
    movimientos: MovimientoCuentaCorrienteCofre[]
  } | null>;

}
