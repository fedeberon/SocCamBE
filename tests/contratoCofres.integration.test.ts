import express from 'express';
import request from 'supertest';
import contratoCofresRoutes from '../src/router/contratoCofres.routes';
import Socio from '../src/models/socio.models';
import CajaSeguridad from '../src/models/CajaSeguridad.models';
import ContratoCofres from '../src/models/contratoCofres.models';

jest.mock('../src/middleware/authMiddleware', () => ({
  checkJwt: (_req: any, _res: any, next: any) => next(),
}));

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

jest.mock('../src/models/contratoCofres.models', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

describe('ContratoCofres endpoints (integration)', () => {
  const app = express();
  app.use(express.json());
  app.use('/contrato-cofres', contratoCofresRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /contrato-cofres crea contrato', async () => {
    (Socio.findByPk as jest.Mock).mockResolvedValue({
      socio_nombre: 'Ana',
      socio_apellido: 'Lopez',
      socio_dni: '30111999',
      socio_domicilio: 'Calle 1',
    });
    (CajaSeguridad.findOne as jest.Mock).mockResolvedValue({ numero: 'C-22' });
    (ContratoCofres.findOne as jest.Mock).mockResolvedValue(null);
    (ContratoCofres.create as jest.Mock).mockResolvedValue({
      contratoCofres_id: 33,
      contratoCofres_esSocioId: 2,
      contratoCofres_nombre: 'Ana Lopez',
      contratoCofres_dni: '30111999',
      contratoCofres_domicilioFiscal: 'Calle 1',
      contratoCofres_cajaId: 9,
      contratoCofres_cajaNumero: 'C-22',
      contratoCofres_estado: 'Pendiente de firma',
      contratoCofres_fechaContratacion: '2026-02-19',
      contratoCofres_fechaVencimiento: null,
      contratoCofres_firmaDigital: null,
      contratoCofres_firmante: null,
      contratoCofres_fechaFirma: null,
    });

    const res = await request(app).post('/contrato-cofres').send({
      socioId: 2,
      cajaId: 9,
      fechaInicio: '2026-02-19',
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 33,
      socioId: 2,
      cajaId: 9,
      estado: 'Pendiente de firma',
    });
  });

  it('GET /contrato-cofres/:id/pdf descarga pdf', async () => {
    (ContratoCofres.findByPk as jest.Mock).mockResolvedValue({
      contratoCofres_id: 10,
      contratoCofres_esSocioId: 6,
      contratoCofres_nombre: 'Pedro Ruiz',
      contratoCofres_dni: '22223333',
      contratoCofres_domicilioFiscal: 'Mitre 100',
      contratoCofres_cajaId: 1,
      contratoCofres_cajaNumero: 'A-1',
      contratoCofres_estado: 'Pendiente de firma',
      contratoCofres_fechaContratacion: '2026-02-19',
      contratoCofres_fechaVencimiento: null,
      contratoCofres_firmaDigital: null,
      contratoCofres_firmante: null,
      contratoCofres_fechaFirma: null,
    });

    const res = await request(app)
      .get('/contrato-cofres/10/pdf')
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment; filename="contrato-caja-A-1-socio-6.pdf"');
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.slice(0, 8).toString()).toContain('%PDF-1.4');
  });

  it('POST /contrato-cofres/:id/firmar firma contrato', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    (ContratoCofres.findByPk as jest.Mock).mockResolvedValue({
      contratoCofres_id: 44,
      contratoCofres_esSocioId: 7,
      contratoCofres_nombre: 'Lucia Paz',
      contratoCofres_dni: '29999111',
      contratoCofres_domicilioFiscal: 'Salta 22',
      contratoCofres_cajaId: 3,
      contratoCofres_cajaNumero: 'B-8',
      contratoCofres_estado: 'Pendiente de firma',
      contratoCofres_fechaContratacion: '2026-02-19',
      contratoCofres_fechaVencimiento: null,
      contratoCofres_firmaDigital: null,
      contratoCofres_firmante: null,
      contratoCofres_fechaFirma: null,
      save,
    });

    const res = await request(app).post('/contrato-cofres/44/firmar').send({
      firmante: 'Lucia Paz',
      firmaDigital: 'sha256-firma',
    });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('Firmado');
    expect(res.body.firmante).toBe('Lucia Paz');
    expect(save).toHaveBeenCalled();
  });
});
