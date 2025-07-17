import Socio from '../models/socio.models';
import PagosSocios from '../models/pagosSocios.models';
import { ISocioService } from '../interfaces/Isocio.service';
import MovimientoCuentaCorrienteCofre from '../models/movimientoCuentaCorrienteCofre.models';
import { Op } from 'sequelize'; // Importar operador para consultas avanzadas

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
        },
        order: [['pagosSocios_fechaVencimiento', 'DESC']] // Reemplaza 'id' por el campo de orden que necesites
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

  async createSocio(socioData: any): Promise<Socio> {
    return await Socio.create(socioData);
  }

  async updateSocio(id: number, socioData: any): Promise<[number, Socio]> {
    const [affectedRows] = await Socio.update(socioData, {
      where: { socio_id: id },
    });
    const socio = await Socio.findByPk(id);
    if (!socio) {
      throw new Error('Socio not found');
    }
    return [affectedRows, socio];
  }

  async deleteSocio(id: number): Promise<number> {
    return await Socio.destroy({
      where: { socio_id: id },
    });
  }
  
  async searchSociosByName(search: string): Promise<Socio[]> {
    return await Socio.findAll({
        where: {
            [Op.or]: [
                { socio_nombre: { [Op.like]: `%${search}%` } },
                {
                    [Op.and]: [
                        { socio_nombre: search.split(' ')[0] || '' }, 
                        { socio_apellido: search.split(' ')[1] || '' }, 
                    ],
                },
            ],
        },
        order: [['socio_nombre', 'ASC']],
    });
}
}


export default SocioService; 
