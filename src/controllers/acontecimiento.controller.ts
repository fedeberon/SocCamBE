import { Request, Response } from 'express';
import logger from '../configs/logger';
import AcontecimientoService from '../service/acontecimiento.service';
import { IAcontecimientoService } from '../interfaces/Iacontecimiento.service';

class AcontecimientoController {
  private static acontecimientoService: IAcontecimientoService = new AcontecimientoService();

  private static responderError(res: Response, error: any, mensaje: string) {
    if (error?.name === 'ValidacionEvento') {
      return res.status(400).json({ message: error.message });
    }
    if (error?.name === 'NoEncontradoEvento') {
      return res.status(404).json({ message: error.message });
    }
    logger.error(mensaje, error);
    return res.status(500).json({ message: mensaje, error });
  }

  static async getAcontecimientos(req: Request, res: Response) {
    try {
      const estado = req.query.estado ? String(req.query.estado) : undefined;
      const acontecimientos = await AcontecimientoController.acontecimientoService.getAllAcontecimientos(estado);
      res.status(200).json(acontecimientos);
    } catch (error) {
      AcontecimientoController.responderError(res, error, 'Error al obtener los acontecimientos');
    }
  }

  static async getAcontecimientoById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const acontecimiento = await AcontecimientoController.acontecimientoService.getAcontecimientoById(Number(id));
      if (acontecimiento) {
        res.status(200).json(acontecimiento);
      } else {
        res.status(404).json({ message: 'Acontecimiento no encontrado' });
      }
    } catch (error) {
      AcontecimientoController.responderError(res, error, 'Error al obtener el acontecimiento');
    }
  }

  static async getAcontecimientosBySocio(req: Request, res: Response) {
    try {
      const { socioId } = req.params;
      const acontecimientos = await AcontecimientoController.acontecimientoService.getAcontecimientosBySocio(Number(socioId));
      res.status(200).json(acontecimientos);
    } catch (error) {
      AcontecimientoController.responderError(res, error, 'Error al obtener acontecimientos por socio');
    }
  }

  static async crear(req: Request, res: Response) {
    try {
      const acontecimiento = await AcontecimientoController.acontecimientoService.crearAcontecimiento(req.body);
      res.status(201).json(acontecimiento);
    } catch (error) {
      AcontecimientoController.responderError(res, error, 'Error al crear el acontecimiento');
    }
  }

  static async actualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const acontecimiento = await AcontecimientoController.acontecimientoService.actualizarAcontecimiento(Number(id), req.body);
      res.status(200).json(acontecimiento);
    } catch (error) {
      AcontecimientoController.responderError(res, error, 'Error al actualizar el acontecimiento');
    }
  }

  static async eliminar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resultado = await AcontecimientoController.acontecimientoService.eliminarAcontecimiento(Number(id));
      res.status(200).json(resultado);
    } catch (error) {
      AcontecimientoController.responderError(res, error, 'Error al eliminar el acontecimiento');
    }
  }

  static async listarUbicaciones(req: Request, res: Response) {
    try {
      const ubicaciones = await AcontecimientoController.acontecimientoService.listarUbicaciones();
      res.status(200).json(ubicaciones);
    } catch (error) {
      AcontecimientoController.responderError(res, error, 'Error al obtener las ubicaciones');
    }
  }

  static async listarCategorias(req: Request, res: Response) {
    try {
      const categorias = await AcontecimientoController.acontecimientoService.listarCategorias();
      res.status(200).json(categorias);
    } catch (error) {
      AcontecimientoController.responderError(res, error, 'Error al obtener las categorías');
    }
  }

  static async listarSocios(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const socios = await AcontecimientoController.acontecimientoService.listarSociosDeAcontecimiento(Number(id));
      res.status(200).json(socios);
    } catch (error) {
      AcontecimientoController.responderError(res, error, 'Error al obtener los socios del acontecimiento');
    }
  }

  static async asignarSocios(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { socioIds } = req.body || {};
      if (!Array.isArray(socioIds)) {
        return res.status(400).json({ message: 'socioIds debe ser un array' });
      }
      const resultado = await AcontecimientoController.acontecimientoService.asignarSocios(Number(id), socioIds);
      res.status(201).json(resultado);
    } catch (error) {
      AcontecimientoController.responderError(res, error, 'Error al asignar socios al acontecimiento');
    }
  }

  static async desasignarSocio(req: Request, res: Response) {
    try {
      const { id, socioId } = req.params;
      const resultado = await AcontecimientoController.acontecimientoService.desasignarSocio(Number(id), Number(socioId));
      res.status(200).json(resultado);
    } catch (error) {
      AcontecimientoController.responderError(res, error, 'Error al quitar el socio del acontecimiento');
    }
  }
}

export default AcontecimientoController;
