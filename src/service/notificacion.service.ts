import Notificacion from '../models/notificacion.model';
import { INotificacionService } from '../interfaces/Inotificacion.service';

class NotificacionService implements INotificacionService {
  async createNotificacion(data: any): Promise<Notificacion> {
    return await Notificacion.create(data);
  }

  async getNotificacionesBySocio(socioId: number): Promise<Notificacion[]> {
    return await Notificacion.findAll({
      where: { socio_id: socioId },
      order: [['fecha', 'DESC']],
    });
  }
  

  async deleteNotificacion(id: number): Promise<number> {
    return await Notificacion.destroy({
      where: { notificacion_id: id },
    });
  }
}

export default NotificacionService;
