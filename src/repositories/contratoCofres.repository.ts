import { Op } from 'sequelize';
import ContratoCofres from '../models/contratoCofres.models';

class ContratoCofresRepository {
  async findAll(): Promise<ContratoCofres[]> {
    return ContratoCofres.findAll({ order: [['contratoCofres_modificado', 'DESC']] });
  }

  async findById(id: number): Promise<ContratoCofres | null> {
    return ContratoCofres.findByPk(id);
  }

  async findBySocioId(socioId: number): Promise<ContratoCofres[]> {
    return ContratoCofres.findAll({
      where: { contratoCofres_esSocioId: socioId },
      order: [['contratoCofres_modificado', 'DESC']],
    });
  }

  async findActiveBySocioCaja(socioId: number, cajaId: number): Promise<ContratoCofres | null> {
    return ContratoCofres.findOne({
      where: {
        contratoCofres_esSocioId: socioId,
        contratoCofres_cajaId: cajaId,
        contratoCofres_fechaVencimiento: { [Op.is]: null },
        contratoCofres_estado: { [Op.ne]: 'Anulado' },
      },
    });
  }

  async create(data: Partial<ContratoCofres>): Promise<ContratoCofres> {
    return ContratoCofres.create(data as any);
  }
}

export default ContratoCofresRepository;
