import { Request, Response } from 'express';
import * as PagosCofresController from '../src/controllers/pagosCofres.controller';
import PagosCofresService from '../src/service/pagosCofres.service';

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


jest.mock('../src/models/pagosCofres.models', () => {
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

jest.mock('../src/service/pagosCofres.service');

describe('PagosCofresController', () => {
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

  describe('getAllPagosCofres', () => {
    it('debería devolver todos los pagos de cofres exitosamente', async () => {
      const mockPagos = [
        {
          pagosCofres_id: 1,
          pagosCofres_contrato: 1,
          pagosCofres_importe: 500.00,
          pagosCofres_periodo: 1,
          pagosCofres_anio: 2024,
          pagosCofres_fechaPago: new Date(),
          pagosCofres_estado: 'PAGADO',
          pagosCofres_facturaNumero: 'A-0001',
          pagosCofres_bonificacion: 0.00,
          pagosCofres_importeCuotaSocial: 0.00,
          pagosCofres_depositoEnGarantia: 0.00
        }
      ];

      (PagosCofresService.getAllPagosCofres as jest.Mock).mockResolvedValue(mockPagos);

      await PagosCofresController.getAllPagosCofres(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.json).toHaveBeenCalledWith(mockPagos);
    });

    it('debería manejar errores al obtener pagos', async () => {
      const mockError = new Error('Error de base de datos');
      (PagosCofresService.getAllPagosCofres as jest.Mock).mockRejectedValue(mockError);

      await PagosCofresController.getAllPagosCofres(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Error al obtener pagos de cofres',
        error: mockError
      });
    });
  });

  describe('getPagosCofresById', () => {
    it('debería devolver un pago cuando existe', async () => {
      const mockPago = {
        pagosCofres_id: 1,
        pagosCofres_contrato: 1,
        pagosCofres_importe: 500.00,
        pagosCofres_periodo: 1,
        pagosCofres_anio: 2024,
        pagosCofres_fechaPago: new Date(),
        pagosCofres_estado: 'PAGADO',
        pagosCofres_facturaNumero: 'A-0001',
        pagosCofres_bonificacion: 0.00,
        pagosCofres_importeCuotaSocial: 0.00,
        pagosCofres_depositoEnGarantia: 0.00
      };

      mockRequest = {
        params: { id: '1' }
      };

      (PagosCofresService.getPagosCofresById as jest.Mock).mockResolvedValue(mockPago);

      await PagosCofresController.getPagosCofresById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.json).toHaveBeenCalledWith(mockPago);
    });

    it('debería devolver 404 cuando el pago no existe', async () => {
      mockRequest = {
        params: { id: '999' }
      };

      (PagosCofresService.getPagosCofresById as jest.Mock).mockResolvedValue(null);

      await PagosCofresController.getPagosCofresById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Pago de cofre no encontrado'
      });
    });
  });

  describe('getPagosCofresByContrato', () => {
    it('debería devolver pagos cuando existen para el contrato', async () => {
      const mockPagos = [
        {
          pagosCofres_id: 1,
          pagosCofres_contrato: 1,
          pagosCofres_importe: 500.00,
          pagosCofres_periodo: 1,
          pagosCofres_anio: 2024,
          pagosCofres_fechaPago: new Date(),
          pagosCofres_estado: 'PAGADO',
          pagosCofres_facturaNumero: 'A-0001',
          pagosCofres_bonificacion: 0.00,
          pagosCofres_importeCuotaSocial: 0.00,
          pagosCofres_depositoEnGarantia: 0.00
        }
      ];

      mockRequest = {
        params: { contratoId: '1' }
      };

      (PagosCofresService.getPagosCofresByContrato as jest.Mock).mockResolvedValue(mockPagos);

      await PagosCofresController.getPagosCofresByContrato(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.json).toHaveBeenCalledWith(mockPagos);
    });

    it('debería devolver 404 cuando no hay pagos para el contrato', async () => {
      mockRequest = {
        params: { contratoId: '999' }
      };

      (PagosCofresService.getPagosCofresByContrato as jest.Mock).mockResolvedValue([]);

      await PagosCofresController.getPagosCofresByContrato(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'No se encontraron pagos para este contrato'
      });
    });

    it('debería manejar errores al obtener pagos por contrato', async () => {
      mockRequest = {
        params: { contratoId: '1' }
      };

      const mockError = new Error('Error de base de datos');
      (PagosCofresService.getPagosCofresByContrato as jest.Mock).mockRejectedValue(mockError);

      await PagosCofresController.getPagosCofresByContrato(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Error al obtener los pagos del contrato',
        error: mockError
      });
    });
  });
});