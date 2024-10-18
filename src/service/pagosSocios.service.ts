import PagosSocios from '../models/pagosSocios.models';

class PagosSociosService {
  async getAllPagosSocios(): Promise<PagosSocios[]> {
    return await PagosSocios.findAll();
  }

  async getPagosSociosById(id: number): Promise<PagosSocios | null> {
    return await PagosSocios.findByPk(id);
  }

  async getPagosSociosBySocio(socioId: number): Promise<PagosSocios[]> {
    return await PagosSocios.findAll({
      where: { pagosSocios_socio: socioId }
    });
  }

}

export default new PagosSociosService();