export interface ICuponService {
  createCupon(data: any): Promise<any>;
  getCupones(): Promise<any[]>;
  getCuponesBySocio(socioId: number): Promise<any[]>;
  getCuponesWithSocios(): Promise<any[]>;
  markAsUsed(id: number): Promise<any>;
  deleteCupon(id: number): Promise<any>;
  assignCupon(socioId: number, cuponId: number): Promise<any>;
  unassignCupon(socioId: number, cuponId: number): Promise<any>;
}
