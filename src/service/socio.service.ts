import Socio from '../models/socio.models';
import PagosSocios from '../models/pagosSocios.models';
import { ISocioService } from '../interfaces/Isocio.service';
import MovimientoCuentaCorrienteCofre from '../models/movimientoCuentaCorrienteCofre.models';

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

  async getSocioMovimientosCofre(id: number): Promise<{
    socio: any,
    movimientos: MovimientoCuentaCorrienteCofre[]
  } | null> {
    const socio = await Socio.findByPk(id);
    
    if (!socio) {
      return null;
    }

    const movimientos = await MovimientoCuentaCorrienteCofre.findAll({
      where: {
        MovimientoCuentaCorrienteCofre_clienteId: id,
        MovimientoCuentaCorrienteCofre_deleted: false
      },
      order: [
        ['MovimientoCuentaCorrienteCofre_fechaIngreso', 'DESC']
      ]
    });

    return {
      socio: socio.get({ plain: true }),
      movimientos: movimientos
    };
  }
}

export default SocioService; 
