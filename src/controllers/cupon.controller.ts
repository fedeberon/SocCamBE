import { Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../configs/logger';
import CuponService from '../service/cupon.service';
import { ICuponService } from '../interfaces/Icupon.service';
import SocioPuntos from '../models/SocioPuntos.models';
import Cupon from '../models/Cupon.models';
import AsignarCupon from '../models/AsignarCupon.models';

class CuponController {
  private static cuponService: ICuponService = new CuponService();

  static async createCupon(req: Request, res: Response) {
    try {
      const cupon = await CuponController.cuponService.createCupon(req.body);
      res.status(201).json(cupon);
    } catch (error) {
      logger.error('Error al crear el cupón:', error);
      res.status(500).json({ message: 'Error al crear el cupón', error });
    }
  }

  static async getCupones(req: Request, res: Response) {
    try {
      const cupones = await CuponController.cuponService.getCupones();
      if (cupones.length === 0) {
        return res.status(404).json({ message: 'No se encontraron cupones' });
      }
      res.status(200).json(cupones);
    } catch (error) {
      logger.error('Error al obtener los cupones:', error);
      res.status(500).json({ message: 'Error al obtener los cupones', error });
    }
  }

  static async getCuponesConSocios(req: Request, res: Response) {
    try {
      const cuponesConSocios = await CuponController.cuponService.getCuponesWithSocios();
      if (cuponesConSocios.length === 0) {
        return res.status(404).json({ message: 'No hay socios asociados a cupones' });
      }
      res.status(200).json(cuponesConSocios);
    } catch (error) {
      logger.error('Error al obtener los socios por cupón:', error);
      res.status(500).json({ message: 'Error al obtener los socios por cupón', error });
    }
  }
  
  static async getCuponesBySocio(req: Request, res: Response) {
    try {
      const { socioId } = req.params;
      const cupones = await CuponController.cuponService.getCuponesBySocio(Number(socioId));
      if (cupones.length === 0) {
        return res.status(404).json({ message: 'No se encontraron cupones para este socio' });
      }
      res.status(200).json(cupones);
    } catch (error) {
      logger.error('Error al obtener los cupones:', error);
      res.status(500).json({ message: 'Error al obtener los cupones', error });
    }
  }

  static async markAsUsed(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await CuponController.cuponService.markAsUsed(Number(id));
      if (updated) {
        res.status(200).json({ message: 'Cupón marcado como usado', cupon: updated });
      } else {
        res.status(404).json({ message: 'Cupón no encontrado' });
      }
    } catch (error) {
      logger.error('Error al marcar el cupón como usado:', error);
      res.status(500).json({ message: 'Error al marcar el cupón como usado', error });
    }
  }

  static async deleteCupon(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await CuponController.cuponService.deleteCupon(Number(id));
      if (deleted) {
        res.status(200).json({ message: 'Cupón eliminado lógicamente', cupon: deleted });
      } else {
        res.status(404).json({ message: 'Cupón no encontrado' });
      }
    } catch (error) {
      logger.error('Error al eliminar el cupón:', error);
      res.status(500).json({ message: 'Error al eliminar el cupón', error });
    }
  }

  static async assignCupon(req: Request, res: Response) {
  const { socioId, cuponId } = req.body;

  console.log('Datos recibidos para asignación:', { socioId, cuponId });

  if (typeof socioId !== 'number' || typeof cuponId !== 'number') {
      return res.status(400).json({ 
          message: 'socioId y cuponId deben ser números',
          receivedSocioId: typeof socioId,
          receivedCuponId: typeof cuponId
      });
  }

  try {
      const result = await CuponController.cuponService.assignCupon(socioId, cuponId);

      if (result?.alreadyAssigned) {
        return res.status(200).json({ 
          message: 'El cupón ya estaba asignado a este socio', 
          asignacion: result.asignacion 
        });
      }

      res.status(201).json(result);
  } catch (error) {
      console.error('Error completo al asignar cupón:', error);
      
      res.status(500).json({ 
          message: 'Error asignando cupón',
          errorDetails: error instanceof Error ? {
              message: error.message,
              name: error.name
          } : 'Error desconocido'
      });
  }
}

  static async unassignCupon(req: Request, res: Response) {
    const { socioId, cuponId } = req.body;

    if (typeof socioId !== 'number' || typeof cuponId !== 'number') {
      return res.status(400).json({
        message: 'socioId y cuponId deben ser números',
        receivedSocioId: typeof socioId,
        receivedCuponId: typeof cuponId,
      });
    }

    try {
      const removed = await CuponController.cuponService.unassignCupon(socioId, cuponId);
      if (!removed) {
        return res.status(404).json({ message: 'No existe asignación para este socio y cupón' });
      }
      res.status(200).json({ message: 'Asignación eliminada', asignacion: removed });
    } catch (error) {
      logger.error('Error al desasignar cupón:', error);
      res.status(500).json({
        message: 'Error al desasignar cupón',
        errorDetails: error instanceof Error ? {
          message: error.message,
          name: error.name,
        } : 'Error desconocido',
      });
    }
  }

  static async canjearPorDescuento(req: Request, res: Response) {
    try {
      const socioId = Number((req.body || {}).socioId);
      const descuento = Number((req.body || {}).descuento || 5);

      if (!Number.isFinite(socioId) || socioId <= 0) return res.status(400).json({ message: 'socioId inválido' });
      if (!Number.isFinite(descuento) || descuento <= 0) return res.status(400).json({ message: 'descuento inválido' });

      const bloques = Math.max(1, Math.round(descuento / 5));
      const puntosNecesarios = bloques * 50000;
      const descuentoFinal = bloques * 5;

      const movimientos = await SocioPuntos.findAll({ where: { socio_id: socioId } as any });
      const totalPuntos = movimientos.reduce((acc: number, m: any) => acc + Number(m.get('puntos') || 0), 0);

      if (totalPuntos < puntosNecesarios) {
        return res.status(400).json({
          message: `Puntos insuficientes. Necesitás ${puntosNecesarios} para canjear ${descuentoFinal}%`,
          totalPuntos,
          puntosNecesarios,
        });
      }

      const codigo = `SCM-${descuentoFinal}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const fechaExpiracion = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Intentamos usar una plantilla de cupón existente (misma estructura que usa SocCamWeb)
      const plantilla = await Cupon.findOne({
        where: {
          descuento: descuentoFinal,
          deleted: false,
        } as any,
        order: [['id', 'DESC']],
      });

      const cupon = await Cupon.create({
        comercio: plantilla?.get('comercio') || 'Cámara Comercial Bolívar',
        descripcion: plantilla?.get('descripcion') || `Cupón de descuento ${descuentoFinal}%`,
        descuento: descuentoFinal,
        fechaExpiracion,
        codigo,
        utilizado: false,
        deleted: false,
      } as any);

      await AsignarCupon.create({ socio_id: socioId, cupon_id: Number(cupon.get('id')) } as any);
      await SocioPuntos.create({
        socio_id: socioId,
        comercio: `Canje cupón ${descuentoFinal}%`,
        puntos: -puntosNecesarios,
        fecha_carga: new Date(),
        qr_payload: `CANJE_${codigo}`,
      } as any);

      return res.status(201).json({
        ok: true,
        cupon,
        puntosConsumidos: puntosNecesarios,
        puntosRestantes: totalPuntos - puntosNecesarios,
      });
    } catch (error) {
      logger.error('Error al canjear puntos por descuento:', error);
      return res.status(500).json({ message: 'Error al canjear puntos por descuento' });
    }
  }

  static async usarCupon(req: Request, res: Response) {
    try {
      const { socioId, cuponId } = req.body;

      if (!socioId || !cuponId) {
        return res.status(400).json({ message: 'socioId y cuponId son requeridos' });
      }

      const result = await CuponController.cuponService.usarCupon(Number(socioId), Number(cuponId));

      if (result?.alreadyUsed) {
        return res.status(400).json({ message: 'Este cupón ya fue utilizado' });
      }
      if (result?.deleted) {
        return res.status(400).json({ message: 'Este cupón fue eliminado' });
      }
      if (result?.expired) {
        return res.status(400).json({ message: 'Este cupón está vencido' });
      }

      res.status(200).json({ message: 'Cupón utilizado correctamente', uso: result.uso });
    } catch (error) {
      logger.error('Error al usar cupón:', error);
      res.status(500).json({ message: 'Error al usar el cupón' });
    }
  }

  static async getCuponesUsados(req: Request, res: Response) {
    try {
      const usos = await CuponController.cuponService.getCuponesUsados();
      res.status(200).json(usos);
    } catch (error) {
      logger.error('Error al obtener cupones usados:', error);
      res.status(500).json({ message: 'Error al obtener cupones usados' });
    }
  }
}

export default CuponController;
