import SosMovimiento from '../models/sosMovimiento.models';

class DeudaService {
  async getDeudaSociosById(id: number): Promise<number> {
    const rows = await SosMovimiento.findAll({
      where: {
        socio_id: id,
        deleted: false,
      },
      attributes: ['montodebe', 'montohaber'],
      raw: true,
    } as any);

    const debe = rows.reduce((acc: number, r: any) => acc + Number(r?.montodebe || 0), 0);
    const haber = rows.reduce((acc: number, r: any) => acc + Number(r?.montohaber || 0), 0);

    return Number((debe - haber).toFixed(2));
  }
}

export default new DeudaService();
