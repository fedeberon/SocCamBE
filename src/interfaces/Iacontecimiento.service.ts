export interface IAcontecimientoService {
    getAllAcontecimientos(): Promise<any[]>;
    getAcontecimientoById(id: number): Promise<any>;
    getAcontecimientosBySocio(socioId: number): Promise<any[]>;
  }