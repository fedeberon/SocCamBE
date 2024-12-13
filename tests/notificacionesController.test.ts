import { Request, Response } from 'express';
import NotificacionController from '../src/controllers/notificacion.controller';
import NotificacionService from '../src/service/notificacion.service';
import Notificacion from '../src/models/notificacion.model';
import logger from '../src/configs/logger';

jest.mock('sequelize', () => {
  const mSequelize = {
    authenticate: jest.fn(),
    define: jest.fn(),
    model: jest.fn(),
    models: {
      Notificacion: {}
    }
  };
  const actualSequelize = jest.requireActual('sequelize');
  return {
    ...actualSequelize,
    Sequelize: jest.fn(() => mSequelize)
  };
});

jest.mock('../src/models/notificacion.model', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
}));

jest.mock('../src/service/notificacion.service');
jest.mock('../src/configs/logger');

jest.mock('../src/configs/database', () => ({
  __esModule: true,
  default: new (jest.requireMock('sequelize').Sequelize)(),
}));

describe('NotificacionController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    responseObject = {
      statusCode: 0,
      json: null
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((result) => {
        responseObject.json = result;
        return mockResponse;
      })
    };
    
    mockRequest = {};

    (Notificacion.findAll as jest.Mock).mockReset();
    (Notificacion.findByPk as jest.Mock).mockReset();
  });

  describe('createNotificacion', () => {
    it('debería crear una nueva notificación con status 201', async () => {
      const mockNotificacionData = {
        notificacion_mensaje: 'Nueva notificación',
        socio_id: 1,
        notificacion_tipo: 'informativa'
      };

      const mockNewNotificacion = {
        notificacion_id: 1,
        ...mockNotificacionData,
        get: () => ({ ...mockNotificacionData, notificacion_id: 1 })
      };

      mockRequest = {
        body: mockNotificacionData
      };

      (NotificacionService.prototype.createNotificacion as jest.Mock).mockResolvedValue(mockNewNotificacion);
      (Notificacion.create as jest.Mock).mockResolvedValue(mockNewNotificacion);

      await NotificacionController.createNotificacion(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockNewNotificacion);
    });

    it('debería manejar errores al crear una notificación y retornar status 500', async () => {
      const mockNotificacionData = {
        notificacion_mensaje: 'Nueva notificación',
        socio_id: 1,
        notificacion_tipo: 'informativa'
      };

      const error = new Error('Error al crear la notificación');
      mockRequest = {
        body: mockNotificacionData
      };

      (NotificacionService.prototype.createNotificacion as jest.Mock).mockRejectedValue(error);
      (Notificacion.create as jest.Mock).mockRejectedValue(error);

      await NotificacionController.createNotificacion(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error al crear la notificación',
        error
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getNotificacionesBySocio', () => {
    it('debería retornar las notificaciones de un socio con status 200', async () => {
      const mockSocioId = 1;
      const mockNotificaciones = [
        { 
          notificacion_id: 1, 
          notificacion_mensaje: 'Mensaje 1',
          socio_id: mockSocioId,
          get: () => ({ notificacion_id: 1, notificacion_mensaje: 'Mensaje 1', socio_id: mockSocioId })
        },
        { 
          notificacion_id: 2, 
          notificacion_mensaje: 'Mensaje 2',
          socio_id: mockSocioId,
          get: () => ({ notificacion_id: 2, notificacion_mensaje: 'Mensaje 2', socio_id: mockSocioId })
        }
      ];

      mockRequest = {
        params: { socioId: mockSocioId.toString() }
      };

      (NotificacionService.prototype.getNotificacionesBySocio as jest.Mock).mockResolvedValue(mockNotificaciones);
      (Notificacion.findAll as jest.Mock).mockResolvedValue(mockNotificaciones);

      await NotificacionController.getNotificacionesBySocio(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockNotificaciones);
    });

    it('debería retornar 404 si no hay notificaciones para el socio', async () => {
      const mockSocioId = 1;

      mockRequest = {
        params: { socioId: mockSocioId.toString() }
      };

      (NotificacionService.prototype.getNotificacionesBySocio as jest.Mock).mockResolvedValue([]);
      (Notificacion.findAll as jest.Mock).mockResolvedValue([]);

      await NotificacionController.getNotificacionesBySocio(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'No se encontraron notificaciones para este socio' });
    });

    it('debería manejar errores al obtener notificaciones y retornar status 500', async () => {
      const mockSocioId = 1;
      const error = new Error('Error al obtener las notificaciones');

      mockRequest = {
        params: { socioId: mockSocioId.toString() }
      };

      (NotificacionService.prototype.getNotificacionesBySocio as jest.Mock).mockRejectedValue(error);
      (Notificacion.findAll as jest.Mock).mockRejectedValue(error);

      await NotificacionController.getNotificacionesBySocio(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error al obtener las notificaciones',
        error
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('debería marcar una notificación como leída con status 200', async () => {
      const mockNotificacionId = 1;
      const mockNotificacion = {
        notificacion_id: mockNotificacionId,
        notificacion_mensaje: 'Mensaje de prueba',
        leida: true,
        markAsRead: jest.fn(),
        save: jest.fn(),
        get: () => ({ notificacion_id: mockNotificacionId, notificacion_mensaje: 'Mensaje de prueba', leida: true })
      };

      mockRequest = {
        params: { id: mockNotificacionId.toString() }
      };

      (NotificacionService.prototype.markAsRead as jest.Mock).mockResolvedValue(mockNotificacion);
      (Notificacion.findByPk as jest.Mock).mockResolvedValue(mockNotificacion);

      await NotificacionController.markAsRead(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Notificación marcada como leída',
        notificacion: mockNotificacion
      });
    });

    it('debería retornar 404 si la notificación no existe', async () => {
      const mockNotificacionId = 1;

      mockRequest = {
        params: { id: mockNotificacionId.toString() }
      };

      (NotificacionService.prototype.markAsRead as jest.Mock).mockResolvedValue(null);
      (Notificacion.findByPk as jest.Mock).mockResolvedValue(null);

      await NotificacionController.markAsRead(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Notificación no encontrada' });
    });

    it('debería manejar errores al marcar como leída y retornar status 500', async () => {
      const mockNotificacionId = 1;
      const error = new Error('Error al marcar la notificación como leída');

      mockRequest = {
        params: { id: mockNotificacionId.toString() }
      };

      (NotificacionService.prototype.markAsRead as jest.Mock).mockRejectedValue(error);
      (Notificacion.findByPk as jest.Mock).mockRejectedValue(error);

      await NotificacionController.markAsRead(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error al marcar la notificación como leída',
        error
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deleteNotificacion', () => {
    it('debería eliminar lógicamente una notificación con status 200', async () => {
      const mockNotificacionId = 1;
      const mockNotificacion = {
        notificacion_id: mockNotificacionId,
        notificacion_mensaje: 'Mensaje de prueba',
        eliminada: true,
        markAsDeleted: jest.fn(),
        save: jest.fn(),
        get: () => ({ notificacion_id: mockNotificacionId, notificacion_mensaje: 'Mensaje de prueba', eliminada: true })
      };

      mockRequest = {
        params: { id: mockNotificacionId.toString() }
      };

      (NotificacionService.prototype.deleteNotificacion as jest.Mock).mockResolvedValue(mockNotificacion);
      (Notificacion.findByPk as jest.Mock).mockResolvedValue(mockNotificacion);

      await NotificacionController.deleteNotificacion(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Notificación eliminada lógicamente',
        notificacion: mockNotificacion
      });
    });

    it('debería retornar 404 si la notificación no existe', async () => {
      const mockNotificacionId = 1;

      mockRequest = {
        params: { id: mockNotificacionId.toString() }
      };

      (NotificacionService.prototype.deleteNotificacion as jest.Mock).mockResolvedValue(null);
      (Notificacion.findByPk as jest.Mock).mockResolvedValue(null);

      await NotificacionController.deleteNotificacion(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Notificación no encontrada' });
    });

    it('debería manejar errores al eliminar una notificación y retornar status 500', async () => {
      const mockNotificacionId = 1;
      const error = new Error('Error al eliminar la notificación');

      mockRequest = {
        params: { id: mockNotificacionId.toString() }
      };

      (NotificacionService.prototype.deleteNotificacion as jest.Mock).mockRejectedValue(error);
      (Notificacion.findByPk as jest.Mock).mockRejectedValue(error);

      await NotificacionController.deleteNotificacion(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error al eliminar la notificación',
        error
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});