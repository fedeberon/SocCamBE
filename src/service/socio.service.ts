import Socio from '../models/socio.models';
import PagosSocios from '../models/pagosSocios.models';
import { ISocioService } from '../interfaces/Isocio.service';

class SocioService implements ISocioService {
  async getAllSocios(): Promise<Socio[]> {
    return await Socio.findAll();
  }

  async getSocioById(id: number): Promise<Socio | null> {
    return await Socio.findByPk(id);
  }

  async getSociosByEmail(email: string): Promise<Socio[]> {
    return await Socio.findAll({
      where: { socio_mail: email }
    });
  }

  async getSociosByMatricula(matricula: number): Promise<Socio[]> {
    return await Socio.findAll({
      where: { socio_numero: matricula }
    });
  }

  async getSocioWithPagos(id: number): Promise<{ [key: string]: any } | null> {
    const socio = await Socio.findByPk(id);
    if (!socio) {
      return null;
    }

    const pagos = await PagosSocios.findAll({
      where: {
        pagosSocios_socio: id
      }
    });

    return {
      ...socio.get({ plain: true }),
      pagos: pagos
    };
  }
}

export default SocioService; 
