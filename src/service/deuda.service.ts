import { Op } from 'sequelize';
import PagosSocios from '../models/pagosSocios.models';
import PagosCofres from '../models/pagosCofres.models';
import ContratoCofres from '../models/contratoCofres.models';

class DeudaService {

  async getDeudaCofreById(id: number): Promise<number> {
    const contratos = await ContratoCofres.findAll({
        where: { contratoCofres_esSocioId: id },
        attributes: ['contratoCofres_id']
      });
    
      const contratoIds = contratos.map(c => c.contratoCofres_id);
    
      if (contratoIds.length === 0) return 0;
    
      const deuda_cofres = await PagosCofres.sum('pagosCofre_monto', {
        where: {
          pagosCofre_contratoId: { [Op.in]: contratoIds },
          pagosCofre_estado: { [Op.ne]: 0 },
        }
      });
    
      return deuda_cofres ?? 0;
     
  }
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