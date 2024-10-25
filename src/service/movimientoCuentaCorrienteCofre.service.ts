import MovimientoCuentaCorrienteCofre from '../models/movimientoCuentaCorrienteCofre.models';
import PagosCofres from '../models/pagosCofres.models';
import { IMovimientoCuentaCorrienteCofreService } from '../interfaces/IMovimientoCuentaCorrienteCofre.service';

class MovimientoCuentaCorrienteCofreService implements IMovimientoCuentaCorrienteCofreService {
  
  async getAllMovimientos(): Promise<MovimientoCuentaCorrienteCofre[]> {
    return await MovimientoCuentaCorrienteCofre.findAll();
  }

  async getMovimientoById(id: number): Promise<MovimientoCuentaCorrienteCofre | null> {
    return await MovimientoCuentaCorrienteCofre.findByPk(id);
  }

  async getMovimientosByClienteId(clienteId: number): Promise<MovimientoCuentaCorrienteCofre[]> {
    return await MovimientoCuentaCorrienteCofre.findAll({
      where: { MovimientoCuentaCorrienteCofre_clienteId: clienteId }
    });
  }

  async getMovimientosByFecha(fecha: Date): Promise<MovimientoCuentaCorrienteCofre[]> {
    return await MovimientoCuentaCorrienteCofre.findAll({
      where: { MovimientoCuentaCorrienteCofre_fechaIngreso: fecha }
    });
  }

  async getMovimientoWithPagos(clienteId: number): Promise<any> {
    const movimientos = await MovimientoCuentaCorrienteCofre.findAll({
      where: {
        MovimientoCuentaCorrienteCofre_clienteId: clienteId
      }
    });

    const pagos = await PagosCofres.findAll({
      where: {
        pagosCofres_contrato: clienteId
      }
    });

    return {
      movimientos,
      pagos
    };
  }
}

export default MovimientoCuentaCorrienteCofreService;
