import Socio from '../models/socio.models';
import PagosSocios from '../models/pagosSocios.models';
import SosMovimiento from '../models/sosMovimiento.models';
import SocioCajaSeguridad from '../models/SocioCajaSeguridad.models';
import { ISocioService } from '../interfaces/Isocio.service';
import MovimientoCuentaCorrienteCofre from '../models/movimientoCuentaCorrienteCofre.models';
import { Op, literal } from 'sequelize';

class SocioService implements ISocioService {
  async getAllSocios(): Promise<Socio[]> {
    return await Socio.findAll();
  }

  async getSocioById(id: number): Promise<Socio | null> {
    const socio = await Socio.findByPk(id);
    if (!socio) return socio;

    // Verificar y sincronizar socio_tieneCajaSeguridad en tiempo real
    const cajasActivas = await SocioCajaSeguridad.count({
      where: { socio_id: id, fecha_fin: { [Op.is]: null } },
    });
    const tieneCaja = cajasActivas > 0;
    
    if (socio.get('socio_tieneCajaSeguridad') !== tieneCaja) {
      await socio.update({ socio_tieneCajaSeguridad: tieneCaja });
    }

    return socio;
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

    const pagosLocales = await PagosSocios.findAll({
        where: { pagosSocios_socio: id },
        order: [['pagosSocios_fechaVencimiento', 'DESC']]
    });

    const socioData = socio.get({ plain: true }) as any;
    const socioCuit = String(socioData?.socio_cuit || '').replace(/\D/g, '');

    let movimientosSos: any[] = [];
    if (socioCuit) {
      movimientosSos = await SosMovimiento.findAll({
        where: {
          socio_id: id,
          cuit_cuil: socioCuit,
          deleted: false,
        },
        order: [['fecha', 'DESC'], ['sos_mov_id', 'DESC']],
      });
    }

    return {
        ...socioData,
        pagos: pagosLocales,
        pagos_sos: movimientosSos,
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
      returning: false,
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
    const parts = search.trim().split(/\s+/);
    const isNumeric = /^\d+$/.test(search.trim());
    const conditions: any[] = [];

    if (isNumeric) {
      conditions.push(
        { socio_id: Number(search.trim()) },
        { socio_numero: Number(search.trim()) },
        { socio_dni: { [Op.like]: `%${search.trim()}%` } },
        { socio_cuit: { [Op.like]: `%${search.trim()}%` } },
      );
    }

    if (parts.length === 1) {
      conditions.push(
        { socio_nombre: { [Op.like]: `%${search}%` } },
        { socio_apellido: { [Op.like]: `%${search}%` } },
      );
    } else {
      conditions.push(
        {
          [Op.and]: [
            { socio_nombre: { [Op.like]: `%${parts[0]}%` } },
            { socio_apellido: { [Op.like]: `%${parts.slice(1).join(' ')}%` } },
          ],
        },
        {
          [Op.and]: [
            { socio_nombre: { [Op.like]: `%${parts.slice(0, -1).join(' ')}%` } },
            { socio_apellido: { [Op.like]: `%${parts[parts.length - 1]}%` } },
          ],
        },
      );
    }

    return await Socio.findAll({
      where: { [Op.or]: conditions },
      order: [['socio_nombre', 'ASC']],
      limit: 50,
    });
  }
}


export default SocioService; 
