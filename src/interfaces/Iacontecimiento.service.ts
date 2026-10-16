export interface IAcontecimientoService {
  getAllAcontecimientos(estado?: string): Promise<any[]>;
  getAcontecimientoById(id: number): Promise<any>;
  getAcontecimientosBySocio(socioId: number): Promise<any[]>;
  crearAcontecimiento(payload: any): Promise<any>;
  actualizarAcontecimiento(id: number, payload: any): Promise<any>;
  eliminarAcontecimiento(id: number): Promise<any>;
  listarUbicaciones(): Promise<any[]>;
  listarCategorias(): Promise<any[]>;
  listarSociosDeAcontecimiento(id: number): Promise<any[]>;
  asignarSocios(id: number, socioIds: number[]): Promise<any>;
  desasignarSocio(id: number, socioId: number): Promise<any>;
}
