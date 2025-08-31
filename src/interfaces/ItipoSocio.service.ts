import TipoSocio from "../models/tipoSocio.models";

export interface ITipoSocioService {
  getTipoSocioById(id: number): Promise<TipoSocio | null>;
  getAllTipoSocios(): Promise<TipoSocio[]>;
  createTipoSocio(tipoSocioData: Partial<TipoSocio>): Promise<TipoSocio>;
  updateTipoSocio(id: number, tipoSocioData: Partial<TipoSocio>): Promise<[number, TipoSocio[]]>;
  deleteTipoSocio(id: number): Promise<number>;
}