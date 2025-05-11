import AsignarCupon from '../models/AsignarCupon.models';
import Cupon from '../models/Cupon.models';
import { ICuponService } from '../interfaces/Icupon.service';
import Socio from '../models/socio.models';

class CuponService implements ICuponService {
  async createCupon(data: any): Promise<any> {
    data.utilizado = false;
    data.deleted = false;

    data.fechaExpiracion = new Date(data.fechaExpiracion);

    return await Cupon.create(data);
  }

  async getCupones(): Promise<any[]> {
    return await Cupon.findAll({ where: { deleted: false } });
  }

  async getCuponesBySocio(socioId: number): Promise<any[]> {
    return await AsignarCupon.findAll({
      where: { socio_id: socioId },
      include: [{
        model: Cupon,
        as: 'cupon',
      }],
    });
  }

  async markAsUsed(id: number): Promise<any> {
    const cupon = await Cupon.findByPk(id);
    if (cupon) {
      cupon.markAsUsed();
      await cupon.save();
      return cupon;
    }
    return null;
  }

  async deleteCupon(id: number): Promise<any> {
    const cupon = await Cupon.findByPk(id);
    if (cupon) {
      cupon.markAsDeleted();
      await cupon.save();
      return cupon;
    }
    return null;
  }

  async assignCupon(socioId: number, cuponId: number): Promise<any> {
    console.log(`Intentando asignar cupón. SocioId: ${socioId}, CuponId: ${cuponId}`);

    const numSocioId = Number(socioId);
    const numCuponId = Number(cuponId);

    const socio = await Socio.findOne({ 
        where: { socio_id: numSocioId } 
    });
    console.log('Socio encontrado:', socio);

    const cupon = await Cupon.findByPk(numCuponId);
    console.log('Cupón encontrado:', cupon);

    if (!socio || !cupon) {
        console.error(`Socio o cupón no encontrado. SocioId: ${numSocioId}, CuponId: ${numCuponId}`);
        throw new Error(`Socio o cupón no encontrado. Socio: ${!!socio}, Cupón: ${!!cupon}`);
    }

    const asignacionExistente = await AsignarCupon.findOne({ 
        where: { 
            socio_id: numSocioId, 
            cupon_id: numCuponId 
        } 
    });

    if (asignacionExistente) {
        console.warn(`Cupón ya asignado. SocioId: ${numSocioId}, CuponId: ${numCuponId}`);
        throw new Error('Este cupón ya fue asignado a este socio');
    }

    return await AsignarCupon.create({ 
        socio_id: numSocioId, 
        cupon_id: numCuponId 
    });
}
}

export default CuponService;
