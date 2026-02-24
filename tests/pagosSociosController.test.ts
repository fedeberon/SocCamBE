import { Request, Response } from 'express';
import * as PagosSociosController from '../src/controllers/pagosSocios.controller';
import PagosSociosService from '../src/service/pagosSocios.service';
import Socio from '../src/models/socio.models';
import sosContadorService from '../src/service/sosContador.service';

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
jest.mock('../src/models/socio.models', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
  }
}));
jest.mock('../src/service/sosContador.service', () => ({
  __esModule: true,
  default: {
    getCobrosBySocioCuit: jest.fn(),
  }
}));

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
    it('debería devolver cobros de SOS cuando encuentra el socio por CUIT', async () => {
      const mockSocio = {
        get: () => ({ socio_cuit: '20301405201' }),
      };
      const mockSosSocio = {
        id: 48971634,
        cuit: '20301405201',
        clipro: 'ABAD LUCIANO CRISTIAN ROLANDO',
      };
      const mockCobros = [
        {
          id: 722381781,
          fecha: '2026-01-15T03:00:00.000Z',
          factura: 'FC-0004-00065305',
          montototal: 284103,
          referencia: '1er semestre 2026',
          cliente: mockSosSocio,
        },
      ];

      mockRequest = {
        params: { socioId: '1' }
      };

      (Socio.findByPk as jest.Mock).mockResolvedValue(mockSocio);
      (sosContadorService.getCobrosBySocioCuit as jest.Mock).mockResolvedValue(mockCobros);

      await PagosSociosController.getPagosSociosBySocio(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.json).toHaveBeenCalledWith([
        expect.objectContaining({
          pagosSocios_id: 722381781,
          pagosSocios_socio: 1,
          pagosSocios_estado: 'PAGADO',
          pagosSocios_monto: 284103,
          sos_cliente: mockSosSocio,
        }),
      ]);
    });

    it('debería devolver 404 cuando el socio no existe', async () => {
      mockRequest = {
        params: { socioId: '999' }
      };

      (Socio.findByPk as jest.Mock).mockResolvedValue(null);

      await PagosSociosController.getPagosSociosBySocio(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Socio no encontrado'
      });
    });

    it('debería devolver 404 cuando no hay pagos del socio en SOS', async () => {
      mockRequest = {
        params: { socioId: '1' }
      };

      const mockSocio = {
        get: () => ({ socio_cuit: '20301405201' }),
      };
      const mockSosSocio = {
        id: 48971634,
        cuit: '20301405201',
      };
      (Socio.findByPk as jest.Mock).mockResolvedValue(mockSocio);
      (sosContadorService.getCobrosBySocioCuit as jest.Mock).mockResolvedValue([]);

      await PagosSociosController.getPagosSociosBySocio(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'No se encontraron pagos del socio en SOS Contador'
      });
    });

    it('debería manejar errores al obtener pagos por socio', async () => {
      mockRequest = {
        params: { socioId: '1' }
      };

      const mockError = new Error('Error de SOS');
      const mockSocio = {
        get: () => ({ socio_cuit: '20301405201' }),
      };
      const mockSosSocio = {
        id: 48971634,
        cuit: '20301405201',
      };
      (Socio.findByPk as jest.Mock).mockResolvedValue(mockSocio);
      (sosContadorService.getCobrosBySocioCuit as jest.Mock).mockRejectedValue(mockError);

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
