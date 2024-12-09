export interface INotificacionService {
    createNotificacion(data: any): Promise<any>;
    getNotificacionesBySocio(socioId: number): Promise<any[]>;
    deleteNotificacion(id: number): Promise<any>;
  }
  