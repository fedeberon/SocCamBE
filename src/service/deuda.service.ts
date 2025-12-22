import { Op } from 'sequelize';
import PagosSocios from '../models/pagosSocios.models';

class DeudaService {

  async getDeudaSociosById(id: number): Promise<number> {
    const resultado = await PagosSocios.sum('pagosSocios_monto', {
      where: {
        pagosSocios_socio: id,
        pagosSocios_deleted:false,
        pagosSocios_estado: {
          [Op.ne]: 0, // distinto de 0
        },
      },
    });    
    return resultado ?? 0;
  }

}

export default new DeudaService();
