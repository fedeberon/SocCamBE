import { IAcontecimientoService } from '../interfaces/Iacontecimiento.service';
import Acontecimiento from '../models/acontecimiento.models';
import AcontecimientoUbicacion from '../models/acontecimientoUbicacion.models';
import AcontecimientoCategoria from '../models/acontecimientoCategoria.models';
import Socio from '../models/socio.models';

class AcontecimientoService implements IAcontecimientoService {
  async getAllAcontecimientos(): Promise<any[]> {
    return await Acontecimiento.findAll({
      include: [
        { model: AcontecimientoUbicacion, as: 'ubicacion' },
        { model: AcontecimientoCategoria, as: 'categoria' },
        { model: Socio, as: 'socios' }
      ],
      where: { deleted: false }
    });
  }

  async getAcontecimientoById(id: number): Promise<any> {
    return await Acontecimiento.findOne({
      where: { acontecimiento_id: id, deleted: false },
      include: [
        { model: AcontecimientoUbicacion, as: 'ubicacion' },
        { model: AcontecimientoCategoria, as: 'categoria' },
        { model: Socio, as: 'socios' }
      ]
    });
  }

  async getAcontecimientosBySocio(socioId: number): Promise<any[]> {
    return await Acontecimiento.findAll({
      include: [
        { model: Socio, as: 'socios', where: { socio_id: socioId } },
        { model: AcontecimientoUbicacion, as: 'ubicacion' },
        { model: AcontecimientoCategoria, as: 'categoria' }
      ],
      where: { deleted: false }
    });
  }

}

export default AcontecimientoService;