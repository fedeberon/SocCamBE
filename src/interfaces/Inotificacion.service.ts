export interface INotificacionService {
  createNotificacion(data: any): Promise<any>;
  getNotificacionesBySocio(socioId: number): Promise<any[]>;
  markAsRead(id: number): Promise<any>;
  deleteNotificacion(id: number): Promise<any>;
}