import AsignarCupon from '../models/asignarCupon.models';
import Cupon from '../models/cupon.models';
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
    const socio = await Socio.findByPk(socioId);
    const cupon = await Cupon.findByPk(cuponId);

    if (!socio || !cupon) {
      throw new Error(`Socio o cupón no encontrado`);
    }

    return await AsignarCupon.create({ socio_id: socioId, cupon_id: cuponId });
  }
}

export default CuponService;
