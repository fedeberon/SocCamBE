import ContratoCofres from '../models/contratoCofres.models';

export interface IContratoCofresService {
  getAllContratoCofres(): Promise<ContratoCofres[]>;
  getContratoCofresById(id: number): Promise<ContratoCofres | null>;
  getContratoCofressBySocioId(socioId: number): Promise<ContratoCofres[]>;
}