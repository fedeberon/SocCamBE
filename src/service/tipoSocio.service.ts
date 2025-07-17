import { ITipoSocioService } from "../interfaces/ItipoSocio.service";
import TipoSocio from "../models/tipoSocio.models";


class TipoSocioService implements ITipoSocioService {
  getTipoSocioById(id: number): Promise<TipoSocio | null> {
    return TipoSocio.findByPk(id);
  }
  getAllTipoSocios(): Promise<TipoSocio[]> {
    return TipoSocio.findAll();
  }
  createTipoSocio(tipoSocioData: Partial<TipoSocio>): Promise<TipoSocio> {
    return TipoSocio.create(tipoSocioData);
  }
  updateTipoSocio(id: number, tipoSocioData: Partial<TipoSocio>): Promise<[number, TipoSocio[]]> {
    return TipoSocio.update(tipoSocioData, {
      where: { id },
      returning: true
    });
  }
  deleteTipoSocio(id: number): Promise<number> {
    return TipoSocio.destroy({
      where: { id }
    });
  }

}


export default TipoSocioService; 
