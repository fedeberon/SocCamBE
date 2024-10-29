import MovimientoCuentaCorrienteCofreService from '../src/service/movimientoCuentaCorrienteCofre.service';
import MovimientoCuentaCorrienteCofre from '../src/models/movimientoCuentaCorrienteCofre.models';
import PagosCofres from '../src/models/pagosCofres.models';

jest.mock('../src/models/movimientoCuentaCorrienteCofre.models');
jest.mock('../src/models/pagosCofres.models');

// Mock de la configuración de la base de datos
jest.mock('../src/configs/database', () => ({
    __esModule: true,
    default: new (jest.requireMock('sequelize').Sequelize)(),
  }));
  
describe('MovimientoCuentaCorrienteCofreService', () => {
  const service = new MovimientoCuentaCorrienteCofreService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAllMovimientos - should return all movements', async () => {
    const mockMovimientos = [{ MovimientoCuentaCorrienteCofre_id: 1 }, { MovimientoCuentaCorrienteCofre_id: 2 }];
    (MovimientoCuentaCorrienteCofre.findAll as jest.Mock).mockResolvedValue(mockMovimientos);

    const result = await service.getAllMovimientos();

    expect(MovimientoCuentaCorrienteCofre.findAll).toHaveBeenCalled();
    expect(result).toEqual(mockMovimientos);
  });

  test('getMovimientoById - should return a specific movement by ID', async () => {
    const mockMovimiento = { MovimientoCuentaCorrienteCofre_id: 1 };
    (MovimientoCuentaCorrienteCofre.findByPk as jest.Mock).mockResolvedValue(mockMovimiento);

    const result = await service.getMovimientoById(1);

    expect(MovimientoCuentaCorrienteCofre.findByPk).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockMovimiento);
  });

  test('getMovimientosByClienteId - should return movements by client ID', async () => {
    const mockMovimientos = [{ MovimientoCuentaCorrienteCofre_clienteId: 1 }];
    (MovimientoCuentaCorrienteCofre.findAll as jest.Mock).mockResolvedValue(mockMovimientos);

    const result = await service.getMovimientosByClienteId(1);

    expect(MovimientoCuentaCorrienteCofre.findAll).toHaveBeenCalledWith({
      where: { MovimientoCuentaCorrienteCofre_clienteId: 1 },
    });
    expect(result).toEqual(mockMovimientos);
  });

  test('getMovimientosByFecha - should return movements by date', async () => {
    const mockFecha = new Date('2023-01-01');
    const mockMovimientos = [{ MovimientoCuentaCorrienteCofre_fechaIngreso: mockFecha }];
    (MovimientoCuentaCorrienteCofre.findAll as jest.Mock).mockResolvedValue(mockMovimientos);

    const result = await service.getMovimientosByFecha(mockFecha);

    expect(MovimientoCuentaCorrienteCofre.findAll).toHaveBeenCalledWith({
      where: { MovimientoCuentaCorrienteCofre_fechaIngreso: mockFecha },
    });
    expect(result).toEqual(mockMovimientos);
  });

  test('getMovimientoWithPagos - should return movements and payments by client ID', async () => {
    const mockMovimientos = [{ MovimientoCuentaCorrienteCofre_clienteId: 1 }];
    const mockPagos = [{ pagosCofres_contrato: 1 }];
    (MovimientoCuentaCorrienteCofre.findAll as jest.Mock).mockResolvedValue(mockMovimientos);
    (PagosCofres.findAll as jest.Mock).mockResolvedValue(mockPagos);

    const result = await service.getMovimientoWithPagos(1);

    expect(MovimientoCuentaCorrienteCofre.findAll).toHaveBeenCalledWith({
      where: { MovimientoCuentaCorrienteCofre_clienteId: 1 },
    });
    expect(PagosCofres.findAll).toHaveBeenCalledWith({
      where: { pagosCofres_contrato: 1 },
    });
    expect(result).toEqual({ movimientos: mockMovimientos, pagos: mockPagos });
  });
});
