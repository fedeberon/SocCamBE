import AsignarCupon from '../models/asignarCupon.models';
import Cupon from '../models/cupon.models';
import { ICuponService } from '../interfaces/Icupon.service';

class CuponService implements ICuponService {
  async createCupon(data: any): Promise<any> {
    return await Cupon.create(data);
  }

  async getCupones(): Promise<any[]> {
    return await Cupon.findAll({ where: { deleted: false } });
  }

  async getCuponesBySocio(socioId: number): Promise<any[]> {
    return await AsignarCupon.findAll({
      where: { socio_id: socioId },
      include: [{ model: Cupon }],
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
    return await AsignarCupon.create({ socio_id: socioId, cupon_id: cuponId });
  }
}

export default CuponService;
