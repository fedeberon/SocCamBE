import { Request, Response } from 'express';
import * as PagosSociosController from '../src/controllers/pagosSocios.controller';
import PagosSociosService from '../src/service/pagosSocios.service';

jest.mock('../src/configs/database', () => {
  return {
    authenticate: jest.fn().mockResolvedValue(true),
    define: jest.fn(),
    sync: jest.fn().mockResolvedValue(true),
    __esModule: true,
    default: {
      authenticate: jest.fn().mockResolvedValue(true),
      define: jest.fn(),
      sync: jest.fn().mockResolvedValue(true),
    }
  };
});

jest.mock('../src/models/pagosSocios.models', () => {
  return {
    __esModule: true,
    default: {
      init: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    }
  };
});

jest.mock('../src/service/pagosSocios.service');

describe('PagosSociosController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    responseObject = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockRequest = {};
    mockResponse = responseObject;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPagosSocios', () => {
    it('debería devolver todos los pagos de socios exitosamente', async () => {
      const mockPagosSocios = [
        {
          pagosSocios_id: 1,
          pagosSocios_socio: 1,
          pagosSocios_monto: 1000,
          pagosSocios_estado: 'PAGADO'
        },
        {
          pagosSocios_id: 2,
          pagosSocios_socio: 2,
          pagosSocios_monto: 2000,
          pagosSocios_estado: 'PENDIENTE'
        }
      ];

      (PagosSociosService.getAllPagosSocios as jest.Mock).mockResolvedValue(mockPagosSocios);

      await PagosSociosController.getAllPagosSocios(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.json).toHaveBeenCalledWith(mockPagosSocios);
    });

    it('debería manejar errores al obtener pagos de socios', async () => {
      const mockError = new Error('Error de base de datos');
      (PagosSociosService.getAllPagosSocios as jest.Mock).mockRejectedValue(mockError);

      await PagosSociosController.getAllPagosSocios(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Error al obtener pagos de socios',
        error: mockError
      });
    });
  });

  describe('getPagosSociosById', () => {
    it('debería devolver un pago de socio cuando existe', async () => {
      const mockPagoSocio = {
        pagosSocios_id: 1,
        pagosSocios_socio: 1,
        pagosSocios_monto: 1000,
        pagosSocios_estado: 'PAGADO'
      };

      mockRequest = {
        params: { id: '1' }
      };

      (PagosSociosService.getPagosSociosById as jest.Mock).mockResolvedValue(mockPagoSocio);

      await PagosSociosController.getPagosSociosById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.json).toHaveBeenCalledWith(mockPagoSocio);
    });

    it('debería devolver 404 cuando el pago de socio no existe', async () => {
      mockRequest = {
        params: { id: '999' }
      };

      (PagosSociosService.getPagosSociosById as jest.Mock).mockResolvedValue(null);

      await PagosSociosController.getPagosSociosById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Pago de socio no encontrado'
      });
    });

    it('debería manejar errores al obtener pago de socio por ID', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      const mockError = new Error('Error de base de datos');
      (PagosSociosService.getPagosSociosById as jest.Mock).mockRejectedValue(mockError);

      await PagosSociosController.getPagosSociosById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Error al obtener el pago de socio',
        error: mockError
      });
    });
  });

  describe('getPagosSociosBySocio', () => {
    it('debería devolver pagos cuando existen para el socio', async () => {
      const mockPagosSocios = [
        {
          pagosSocios_id: 1,
          pagosSocios_socio: 1,
          pagosSocios_monto: 1000,
          pagosSocios_estado: 'PAGADO'
        }
      ];

      mockRequest = {
        params: { socioId: '1' }
      };

      (PagosSociosService.getPagosSociosBySocio as jest.Mock).mockResolvedValue(mockPagosSocios);

      await PagosSociosController.getPagosSociosBySocio(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.json).toHaveBeenCalledWith(mockPagosSocios);
    });

    it('debería devolver 404 cuando no hay pagos para el socio', async () => {
      mockRequest = {
        params: { socioId: '999' }
      };

      (PagosSociosService.getPagosSociosBySocio as jest.Mock).mockResolvedValue([]);

      await PagosSociosController.getPagosSociosBySocio(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'No se encontraron pagos para este socio'
      });
    });

    it('debería manejar errores al obtener pagos por socio', async () => {
      mockRequest = {
        params: { socioId: '1' }
      };

      const mockError = new Error('Error de base de datos');
      (PagosSociosService.getPagosSociosBySocio as jest.Mock).mockRejectedValue(mockError);

      await PagosSociosController.getPagosSociosBySocio(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Error al obtener los pagos del socio',
        error: mockError
      });
    });
  });
});