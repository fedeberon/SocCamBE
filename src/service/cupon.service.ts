import AsignarCupon from '../models/AsignarCupon.models';
import Cupon from '../models/Cupon.models';
import { ICuponService } from '../interfaces/Icupon.service';
import Socio from '../models/socio.models';

class CuponService implements ICuponService {
  async createCupon(data: any): Promise<any> {
    data.utilizado = false;
    data.deleted = false;

    data.fechaExpiracion = new Date(data.fechaExpiracion);

    return await Cupon.create(data);
  }

  async getCupones(): Promise<any[]> {
    return await Cupon.findAll({ where: { deleted: false } });
  }

  async getCuponesWithSocios(): Promise<any[]> {
    const asignaciones = await AsignarCupon.findAll({
      include: [
        { model: Cupon, as: 'cupon' },
        { model: Socio, as: 'socio' },
      ],
    });

    const cuponesAgrupados: Record<number, { cupon: any; socios: any[] }> = {};

    asignaciones.forEach((asignacion: any) => {
      const cupon = asignacion.cupon;
      const socio = asignacion.socio;

      if (!cupon) {
        return;
      }

      if (!cuponesAgrupados[cupon.id]) {
        cuponesAgrupados[cupon.id] = { cupon, socios: [] };
      }

      if (socio) {
        const yaExiste = cuponesAgrupados[cupon.id].socios.some(
          (s) => String(s.socio_id) === String(socio.socio_id),
        );
        if (!yaExiste) {
          cuponesAgrupados[cupon.id].socios.push(socio);
        }
      }
    });

    return Object.values(cuponesAgrupados);
  }

  async getCuponesBySocio(socioId: number): Promise<any[]> {
    return await AsignarCupon.findAll({
      where: { socio_id: socioId },
      include: [{
        model: Cupon,
        as: 'cupon',
      }],
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
    console.log(`Intentando asignar cupón. SocioId: ${socioId}, CuponId: ${cuponId}`);

    const numSocioId = Number(socioId);
    const numCuponId = Number(cuponId);

    const socio = await Socio.findOne({ 
        where: { socio_id: numSocioId } 
    });
    console.log('Socio encontrado:', socio);

    const cupon = await Cupon.findByPk(numCuponId);
    console.log('Cupón encontrado:', cupon);

    if (!socio || !cupon) {
        console.error(`Socio o cupón no encontrado. SocioId: ${numSocioId}, CuponId: ${numCuponId}`);
        throw new Error(`Socio o cupón no encontrado. Socio: ${!!socio}, Cupón: ${!!cupon}`);
    }

    const asignacionExistente = await AsignarCupon.findOne({ 
        where: { 
            socio_id: numSocioId, 
            cupon_id: numCuponId 
        } 
    });

    if (asignacionExistente) {
        console.warn(`Cupón ya asignado. SocioId: ${numSocioId}, CuponId: ${numCuponId}`);
        return { alreadyAssigned: true, asignacion: asignacionExistente };
    }

    return await AsignarCupon.create({ 
        socio_id: numSocioId, 
        cupon_id: numCuponId 
    });
}

  async unassignCupon(socioId: number, cuponId: number): Promise<any> {
    const numSocioId = Number(socioId);
    const numCuponId = Number(cuponId);

    const asignacion = await AsignarCupon.findOne({
      where: { socio_id: numSocioId, cupon_id: numCuponId },
    });

    if (!asignacion) {
      return null;
    }

    await asignacion.destroy();
    return asignacion;
  }
}

export default CuponService;
