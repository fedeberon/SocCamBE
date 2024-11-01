import { Request, Response } from 'express';
import SocioController from '../src/controllers/socio.controller';
import SocioService from '../src/service/socio.service';
import Socio from '../src/models/socio.models';
import PagosSocios from '../src/models/pagosSocios.models';
import logger from '../src/configs/logger';

// Mock de Sequelize
jest.mock('sequelize', () => {
  const mSequelize = {
    authenticate: jest.fn(),
    define: jest.fn(),
    model: jest.fn(),
    models: {
      Socio: {},
      PagosSocios: {}
    }
  };
  const actualSequelize = jest.requireActual('sequelize');
  return {
    ...actualSequelize,
    Sequelize: jest.fn(() => mSequelize)
  };
});

// Mock de los modelos
jest.mock('../src/models/socio.models', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
}));

jest.mock('../src/models/pagosSocios.models', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
}));

// Mock del servicio y logger
jest.mock('../src/service/socio.service');
jest.mock('../src/configs/logger');

// Mock de la configuración de la base de datos
jest.mock('../src/configs/database', () => ({
  __esModule: true,
  default: new (jest.requireMock('sequelize').Sequelize)(),
}));

describe('SocioController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    // Reset todos los mocks antes de cada test
    jest.clearAllMocks();
    
    // Configurar el mock de response
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

    // Reset de los mocks de los modelos
    (Socio.findAll as jest.Mock).mockReset();
    (Socio.findByPk as jest.Mock).mockReset();
    (PagosSocios.findAll as jest.Mock).mockReset();
  });

  describe('getSocios', () => {
    it('debería retornar todos los socios con status 200', async () => {
      const mockSocios = [
        { 
          socio_id: 1, 
          socio_nombre: 'Juan',
          get: () => ({ socio_id: 1, socio_nombre: 'Juan' })
        },
        { 
          socio_id: 2, 
          socio_nombre: 'Pedro',
          get: () => ({ socio_id: 2, socio_nombre: 'Pedro' })
        }
      ];

      (SocioService.prototype.getAllSocios as jest.Mock).mockResolvedValue(mockSocios);
      (Socio.findAll as jest.Mock).mockResolvedValue(mockSocios);

      await SocioController.getSocios(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockSocios);
    });

    it('debería manejar errores de base de datos y retornar status 500', async () => {
      const error = new Error('Error de conexión a la base de datos');
      (SocioService.prototype.getAllSocios as jest.Mock).mockRejectedValue(error);
      (Socio.findAll as jest.Mock).mockRejectedValue(error);

      await SocioController.getSocios(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error al obtener los socios',
        error
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getSocioById', () => {
    it('debería retornar un socio por ID con status 200', async () => {
      const mockSocio = { 
        socio_id: 1, 
        socio_nombre: 'Juan',
        get: () => ({ socio_id: 1, socio_nombre: 'Juan' })
      };
      
      mockRequest = {
        params: { id: '1' }
      };

      (SocioService.prototype.getSocioById as jest.Mock).mockResolvedValue(mockSocio);
      (Socio.findByPk as jest.Mock).mockResolvedValue(mockSocio);

      await SocioController.getSocioById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockSocio);
    });

    it('debería manejar errores de base de datos en búsqueda por ID', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      const error = new Error('Error de conexión a la base de datos');
      (SocioService.prototype.getSocioById as jest.Mock).mockRejectedValue(error);
      (Socio.findByPk as jest.Mock).mockRejectedValue(error);

      await SocioController.getSocioById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getSocioWithPagos', () => {
    it('debería retornar socio con sus pagos y status 200', async () => {
      const mockSocio = { 
        socio_id: 1, 
        socio_nombre: 'Juan',
        get: () => ({ 
          socio_id: 1, 
          socio_nombre: 'Juan' 
        })
      };

      const mockPagos = [
        { 
          pago_id: 1, 
          monto: 100,
          get: () => ({ pago_id: 1, monto: 100 })
        }
      ];

      const mockSocioWithPagos = {
        ...mockSocio.get(),
        pagos: mockPagos
      };

      mockRequest = {
        params: { id: '1' }
      };

      (SocioService.prototype.getSocioWithPagos as jest.Mock).mockResolvedValue(mockSocioWithPagos);
      (Socio.findByPk as jest.Mock).mockResolvedValue(mockSocio);
      (PagosSocios.findAll as jest.Mock).mockResolvedValue(mockPagos);

      await SocioController.getSocioWithPagos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockSocioWithPagos);
    });

    it('debería manejar errores de base de datos al buscar pagos', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      const error = new Error('Error al consultar pagos');
      (SocioService.prototype.getSocioWithPagos as jest.Mock).mockRejectedValue(error);
      (PagosSocios.findAll as jest.Mock).mockRejectedValue(error);

      await SocioController.getSocioWithPagos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getSociosByEmail', () => {
    it('debería retornar socios por email con status 200', async () => {
      const mockSocios = [
        { 
          socio_id: 1, 
          socio_mail: 'test@test.com',
          get: () => ({ 
            socio_id: 1, 
            socio_mail: 'test@test.com' 
          })
        }
      ];

      mockRequest = {
        params: { email: 'test@test.com' }
      };

      (SocioService.prototype.getSociosByEmail as jest.Mock).mockResolvedValue(mockSocios);
      (Socio.findAll as jest.Mock).mockResolvedValue(mockSocios);

      await SocioController.getSociosByEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockSocios);
    });
  });

  describe('getSociosByMatricula', () => {
    it('debería retornar socios por matrícula con status 200', async () => {
      const mockSocios = [
        { 
          socio_id: 1, 
          socio_numero: 12345,
          get: () => ({ 
            socio_id: 1, 
            socio_numero: 12345 
          })
        }
      ];

      mockRequest = {
        params: { matricula: '12345' }
      };

      (SocioService.prototype.getSociosByMatricula as jest.Mock).mockResolvedValue(mockSocios);
      (Socio.findAll as jest.Mock).mockResolvedValue(mockSocios);

      await SocioController.getSociosByMatricula(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockSocios);
    });
  });
});