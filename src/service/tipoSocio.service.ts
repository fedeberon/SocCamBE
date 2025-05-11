import TipoSocio from "../models/tipoSocio.models";


class TipoSocioService {
  static async getTipoSocioById(id: number): Promise<TipoSocio | null> {
    return await TipoSocio.findByPk(id);
  }

}


export default TipoSocioService; 
