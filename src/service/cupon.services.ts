import Cupon from '../models/Cupon.models';
import Socio from '../models/socio.models';

class CuponService {
  static async getAllCupones() {
    return await Cupon.findAll({ include: { model: Socio, as: 'socios', required: false } });
  }

  static async getCuponById(id: number) {
    return await Cupon.findByPk(id, { include: { model: Socio, as: 'socios' } });
  }

  static async createCupon(data: any) {
    return await Cupon.create(data);
  }

  static async updateCupon(id: number, data: any) {
    const cupon = await Cupon.findByPk(id);
    if (cupon) {
      return await cupon.update(data);
    }
    return null;
  }

  static async assignCuponToSocios(cuponId: number, socioIds: number[]) {
    const cupon = await Cupon.findByPk(cuponId);
    const socios = await Socio.findAll({ where: { id: socioIds } });
    if (cupon && socios.length) {
      /* await cupon.addSocios(socios);
      return cupon; */
    }
    throw new Error('Cupón o socios no encontrados');
  }
}

export default CuponService;
