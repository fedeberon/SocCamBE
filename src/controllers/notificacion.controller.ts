import { Request, Response } from 'express';
import logger from '../configs/logger';
import NotificacionService from '../service/notificacion.service';
import { INotificacionService } from '../interfaces/Inotificacion.service';

class NotificacionController {
  private static notificacionService: INotificacionService = new NotificacionService();

  static async createNotificacion(req: Request, res: Response) {
    try {
      const notificacion = await NotificacionController.notificacionService.createNotificacion(req.body);
      res.status(201).json(notificacion);
    } catch (error) {
      logger.error('Error al crear la notificación:', error);
      res.status(500).json({ message: 'Error al crear la notificación', error });
    }
  }

  static async getNotificacionesBySocio(req: Request, res: Response) { 
    try { 
      const { socioId } = req.params; 
      
      const notificaciones = await NotificacionController.notificacionService.getNotificacionesBySocio(Number(socioId)); 
            
      if (notificaciones.length === 0) {
        return res.status(404).json({ message: 'No se encontraron notificaciones para este socio' });
      }
      
      res.status(200).json(notificaciones); 
    } catch (error) { 
      logger.error('Error al obtener las notificaciones:', error); 
      res.status(500).json({ message: 'Error al obtener las notificaciones', error }); 
    } 
  }

  static async deleteNotificacion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await NotificacionController.notificacionService.deleteNotificacion(Number(id));
      if (deleted) {
        res.status(200).json({ message: 'Notificación eliminada correctamente' });
      } else {
        res.status(404).json({ message: 'Notificación no encontrada' });
      }
    } catch (error) {
      logger.error('Error al eliminar la notificación:', error);
      res.status(500).json({ message: 'Error al eliminar la notificación', error });
    }
  }
}

export default NotificacionController;
