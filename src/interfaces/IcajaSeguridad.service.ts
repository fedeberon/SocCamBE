export interface ICajaSeguridadService {
  getTamanos(): Promise<any[]>;
  createTamano(data: any): Promise<any>;
  updateTamano(id: number, data: any): Promise<[number, any[]]>;

  getCajas(options?: { page?: number; pageSize?: number }): Promise<any[]>;
  getCajaById(id: number): Promise<any | null>;
  createCaja(data: any): Promise<any>;
  updateCaja(id: number, data: any): Promise<[number, any[]]>;
  deleteCaja(id: number): Promise<any | null>;

  getSociosByCaja(cajaId: number): Promise<any[]>;
  getCajasBySocio(socioId: number): Promise<any[]>;
  getCofresVencidos(): Promise<any[]>;
  assignSocioACaja(payload: { socioId: number; cajaId: number; esTitular?: boolean; fechaInicio?: string; fechaFin?: string | null; nota?: string }): Promise<any>;
  unassignSocioDeCaja(socioId: number, cajaId: number): Promise<{ socioCajaId: number; cajaId: number; socioId: number } | null>;
  syncTieneCajaSeguridad(): Promise<{ actualizados: number }>;
}
