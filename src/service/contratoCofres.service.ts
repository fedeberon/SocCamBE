import ContratoCofres from '../models/contratoCofres.models';
import { IContratoCofresService } from '../interfaces/IcontratoCofres.service';

class ContratoCofresService implements IContratoCofresService {
  async getAllContratoCofres(): Promise<ContratoCofres[]> {
    return await ContratoCofres.findAll();
  }

  async getContratoCofresById(id: number): Promise<ContratoCofres | null> {
    return await ContratoCofres.findByPk(id);
  }

  async getContratoCofressBySocioId(socioId: number): Promise<ContratoCofres[]> {
    return await ContratoCofres.findAll({
      where: { contratoCofres_esSocioId: socioId }
    });
  }
}

export default ContratoCofresService;