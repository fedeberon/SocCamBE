import Notificacion from '../models/notificacion.model';
import { INotificacionService } from '../interfaces/Inotificacion.service';

class NotificacionService implements INotificacionService {
  async createNotificacion(data: any): Promise<any> {
    return await Notificacion.create(data);
  }

  async getNotificacionesBySocio(socioId: number): Promise<any[]> {
    return await Notificacion.findAll({ where: { socio_id: socioId } });
  }

  async markAsRead(id: number): Promise<any> {
    const notificacion = await Notificacion.findByPk(id);
    if (notificacion) {
      notificacion.markAsRead();
      await notificacion.save();
      return notificacion;
    }
    return null;
  }

  async deleteNotificacion(id: number): Promise<any> {
    const notificacion = await Notificacion.findByPk(id);
    if (notificacion) {
      notificacion.markAsDeleted(); // Marcar como eliminada lógicamente
      await notificacion.save();
      return notificacion;
    }
    return null;
  }
}

export default NotificacionService;