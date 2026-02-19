import ContratoCofresService, { ServiceError } from '../src/service/contratoCofres.service';
import Socio from '../src/models/socio.models';
import CajaSeguridad from '../src/models/CajaSeguridad.models';

jest.mock('../src/models/socio.models', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../src/models/CajaSeguridad.models', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

describe('ContratoCofresService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('crea contrato con estado inicial pendiente de firma', async () => {
    const mockRepo = {
      findActiveBySocioCaja: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        contratoCofres_id: 1,
        contratoCofres_esSocioId: 5,
        contratoCofres_nombre: 'Juan Perez',
        contratoCofres_dni: '30111222',
        contratoCofres_domicilioFiscal: 'Av Siempre Viva 123',
        contratoCofres_cajaId: 10,
        contratoCofres_cajaNumero: 'A-15',
        contratoCofres_estado: 'Pendiente de firma',
        contratoCofres_fechaContratacion: '2026-02-19',
        contratoCofres_fechaVencimiento: null,
        contratoCofres_firmaDigital: null,
        contratoCofres_firmante: null,
        contratoCofres_fechaFirma: null,
      }),
    };

    (Socio.findByPk as jest.Mock).mockResolvedValue({
      socio_nombre: 'Juan',
      socio_apellido: 'Perez',
      socio_dni: '30111222',
      socio_domicilio: 'Av Siempre Viva 123',
    });
    (CajaSeguridad.findOne as jest.Mock).mockResolvedValue({ numero: 'A-15' });

    const service = new ContratoCofresService(mockRepo as any);
    const result = await service.createContratoCofre({ socioId: 5, cajaId: 10, fechaInicio: '2026-02-19' });

    expect(result.estado).toBe('Pendiente de firma');
    expect(result.socioId).toBe(5);
    expect(result.cajaId).toBe(10);
    expect(mockRepo.findActiveBySocioCaja).toHaveBeenCalledWith(5, 10);
  });

  it('lanza 409 cuando existe contrato activo duplicado', async () => {
    const mockRepo = {
      findActiveBySocioCaja: jest.fn().mockResolvedValue({ id: 99 }),
    };

    (Socio.findByPk as jest.Mock).mockResolvedValue({ socio_nombre: 'A' });
    (CajaSeguridad.findOne as jest.Mock).mockResolvedValue({ numero: '1' });

    const service = new ContratoCofresService(mockRepo as any);

    await expect(service.createContratoCofre({ socioId: 1, cajaId: 1 })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('firma contrato y cambia estado a firmado', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const contrato = {
      contratoCofres_id: 7,
      contratoCofres_esSocioId: 1,
      contratoCofres_nombre: 'S',
      contratoCofres_dni: '11',
      contratoCofres_domicilioFiscal: 'D',
      contratoCofres_cajaId: 2,
      contratoCofres_cajaNumero: 'B-1',
      contratoCofres_estado: 'Pendiente de firma',
      contratoCofres_fechaContratacion: '2026-02-19',
      contratoCofres_fechaVencimiento: null,
      contratoCofres_firmaDigital: null,
      contratoCofres_firmante: null,
      contratoCofres_fechaFirma: null,
      save,
    };

    const mockRepo = {
      findById: jest.fn().mockResolvedValue(contrato),
    };

    const service = new ContratoCofresService(mockRepo as any);
    const result = await service.firmarContrato(7, { firmante: 'Juan Perez', firmaDigital: 'abc123' });

    expect(save).toHaveBeenCalled();
    expect(result.estado).toBe('Firmado');
    expect(result.firmante).toBe('Juan Perez');
    expect(result.firmaDigital).toBe('abc123');
  });
});
