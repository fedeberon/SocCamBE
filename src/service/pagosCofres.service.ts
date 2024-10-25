import PagosCofres from '../models/pagosCofres.models';

class PagosCofresService {
  async getAllPagosCofres(): Promise<PagosCofres[]> {
    return await PagosCofres.findAll();
  }

  async getPagosCofresById(id: number): Promise<PagosCofres | null> {
    return await PagosCofres.findByPk(id);
  }

  async getPagosCofresByContrato(contratoId: number): Promise<PagosCofres[]> {
    return await PagosCofres.findAll({
      where: { pagosCofres_contrato: contratoId }
    });
  }
}

export default new PagosCofresService();