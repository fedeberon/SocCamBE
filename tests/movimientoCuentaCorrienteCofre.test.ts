import { Request, Response } from 'express';
import * as MovimientoController from '../src/controllers/movimientoCuentaCorrienteCofre.controller';
import MovimientoService from '../src/service/movimientoCuentaCorrienteCofre.service';

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

jest.mock('../src/models/movimientoCuentaCorrienteCofre.models', () => {
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

jest.mock('../src/service/movimientoCuentaCorrienteCofre.service');

describe('MovimientoCuentaCorrienteCofreController', () => {
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

  describe('getMovimientos', () => {
    it('debería devolver todos los movimientos exitosamente', async () => {
      const mockMovimientos = [
        {
          MovimientoCuentaCorrienteCofre_id: 1,
          MovimientoCuentaCorrienteCofre_clienteId: 1,
          MovimientoCuentaCorrienteCofre_importe: 1000
        },
        {
          MovimientoCuentaCorrienteCofre_id: 2,
          MovimientoCuentaCorrienteCofre_clienteId: 2,
          MovimientoCuentaCorrienteCofre_importe: 2000
        }
      ];

      (MovimientoService.getAllMovimientos as jest.Mock).mockResolvedValue(mockMovimientos);

      await MovimientoController.getMovimientos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.json).toHaveBeenCalledWith(mockMovimientos);
    });

    it('debería manejar errores al obtener movimientos', async () => {
      const mockError = new Error('Error de base de datos');
      (MovimientoService.getAllMovimientos as jest.Mock).mockRejectedValue(mockError);

      await MovimientoController.getMovimientos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Error al obtener movimientos',
        error: mockError
      });
    });
  });

  describe('getMovimientoById', () => {
    it('debería devolver un movimiento cuando existe', async () => {
      const mockMovimiento = {
        MovimientoCuentaCorrienteCofre_id: 1,
        MovimientoCuentaCorrienteCofre_clienteId: 1,
        MovimientoCuentaCorrienteCofre_importe: 1000
      };

      mockRequest = {
        params: { id: '1' }
      };

      (MovimientoService.getMovimientoById as jest.Mock).mockResolvedValue(mockMovimiento);

      await MovimientoController.getMovimientoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.json).toHaveBeenCalledWith(mockMovimiento);
    });

    it('debería devolver 404 cuando el movimiento no existe', async () => {
      mockRequest = {
        params: { id: '999' }
      };

      (MovimientoService.getMovimientoById as jest.Mock).mockResolvedValue(null);

      await MovimientoController.getMovimientoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Movimiento no encontrado'
      });
    });
  });

  describe('getMovimientosByClienteId', () => {
    it('debería devolver movimientos cuando existen para el cliente', async () => {
      const mockMovimientos = [
        {
          MovimientoCuentaCorrienteCofre_id: 1,
          MovimientoCuentaCorrienteCofre_clienteId: 1,
          MovimientoCuentaCorrienteCofre_importe: 1000
        }
      ];

      mockRequest = {
        params: { clienteId: '1' }
      };

      (MovimientoService.getMovimientosByClienteId as jest.Mock).mockResolvedValue(mockMovimientos);

      await MovimientoController.getMovimientosByClienteId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.json).toHaveBeenCalledWith(mockMovimientos);
    });

    it('debería devolver 404 cuando no hay movimientos para el cliente', async () => {
      mockRequest = {
        params: { clienteId: '999' }
      };

      (MovimientoService.getMovimientosByClienteId as jest.Mock).mockResolvedValue([]);

      await MovimientoController.getMovimientosByClienteId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'No se encontraron movimientos para este cliente'
      });
    });
  });

  describe('getMovimientosByFecha', () => {
    it('debería devolver movimientos cuando existen para la fecha', async () => {
      const mockMovimientos = [
        {
          MovimientoCuentaCorrienteCofre_id: 1,
          MovimientoCuentaCorrienteCofre_fechaIngreso: new Date('2024-01-01'),
          MovimientoCuentaCorrienteCofre_importe: 1000
        }
      ];

      mockRequest = {
        params: { fecha: '2024-01-01' }
      };

      (MovimientoService.getMovimientosByFecha as jest.Mock).mockResolvedValue(mockMovimientos);

      await MovimientoController.getMovimientosByFecha(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.json).toHaveBeenCalledWith(mockMovimientos);
    });

    it('debería devolver 404 cuando no hay movimientos para la fecha', async () => {
      mockRequest = {
        params: { fecha: '2024-01-01' }
      };

      (MovimientoService.getMovimientosByFecha as jest.Mock).mockResolvedValue([]);

      await MovimientoController.getMovimientosByFecha(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'No se encontraron movimientos para esta fecha'
      });
    });
  });

  describe('getMovimientoWithPagos', () => {
    it('debería devolver movimientos y pagos cuando existen para el cliente', async () => {
      const mockData = {
        movimientos: [
          {
            MovimientoCuentaCorrienteCofre_id: 1,
            MovimientoCuentaCorrienteCofre_clienteId: 1,
            MovimientoCuentaCorrienteCofre_importe: 1000
          }
        ],
        pagos: [
          {
            pagosCofres_id: 1,
            pagosCofres_contrato: 1,
            pagosCofres_importe: 1000
          }
        ]
      };

      mockRequest = {
        params: { clienteId: '1' }
      };

      (MovimientoService.getMovimientoWithPagos as jest.Mock).mockResolvedValue(mockData);

      await MovimientoController.getMovimientoWithPagos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.json).toHaveBeenCalledWith(mockData);
    });

    it('debería devolver 404 cuando no hay registros para el cliente', async () => {
      mockRequest = {
        params: { clienteId: '999' }
      };

      (MovimientoService.getMovimientoWithPagos as jest.Mock).mockResolvedValue({
        movimientos: [],
        pagos: []
      });

      await MovimientoController.getMovimientoWithPagos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseObject.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'No se encontraron registros para este cliente'
      });
    });
  });
});