import ContratoCofres from '../models/contratoCofres.models';
import Socio from '../models/socio.models';
import CajaSeguridad from '../models/CajaSeguridad.models';
import ContratoCofresRepository from '../repositories/contratoCofres.repository';
import {
  CreateContratoCofrePayload,
  ContratoCofreResponse,
  FirmarContratoPayload,
  IContratoCofresService,
} from '../interfaces/IcontratoCofres.service';

export class ServiceError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

class ContratoCofresService implements IContratoCofresService {
  private repository: ContratoCofresRepository;

  constructor(repository: ContratoCofresRepository = new ContratoCofresRepository()) {
    this.repository = repository;
  }

  private toResponse(contrato: ContratoCofres): ContratoCofreResponse {
    return {
      id: contrato.contratoCofres_id,
      socioId: contrato.contratoCofres_esSocioId,
      socioNombre: contrato.contratoCofres_nombre,
      socioDni: contrato.contratoCofres_dni || '',
      domicilioFiscal: contrato.contratoCofres_domicilioFiscal || '',
      cajaId: contrato.contratoCofres_cajaId || 0,
      cajaNumero: contrato.contratoCofres_cajaNumero || String(contrato.contratoCofres_cofreNumero || ''),
      estado: contrato.contratoCofres_estado,
      fechaInicio: contrato.contratoCofres_fechaContratacion,
      fechaFin: contrato.contratoCofres_fechaVencimiento || null,
      firmaDigital: contrato.contratoCofres_firmaDigital || null,
      firmante: contrato.contratoCofres_firmante || null,
      fechaFirma: contrato.contratoCofres_fechaFirma ? new Date(contrato.contratoCofres_fechaFirma).toISOString() : null,
    };
  }

  private todayDateOnly(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async getAllContratoCofres(): Promise<ContratoCofreResponse[]> {
    const contratos = await this.repository.findAll();
    return contratos.map((contrato) => this.toResponse(contrato));
  }

  async getContratoCofresById(id: number): Promise<ContratoCofreResponse | null> {
    const contrato = await this.repository.findById(id);
    return contrato ? this.toResponse(contrato) : null;
  }

  async getContratoCofressBySocioId(socioId: number): Promise<ContratoCofreResponse[]> {
    const contratos = await this.repository.findBySocioId(socioId);
    return contratos.map((contrato) => this.toResponse(contrato));
  }

  async createContratoCofre(payload: CreateContratoCofrePayload): Promise<ContratoCofreResponse> {
    const socio = await Socio.findByPk(payload.socioId);
    if (!socio) {
      throw new ServiceError(404, 'Socio no encontrado');
    }

    const caja = await CajaSeguridad.findOne({ where: { caja_id: payload.cajaId, deleted: false } });
    if (!caja) {
      throw new ServiceError(404, 'Caja no encontrada');
    }

    const contratoActivo = await this.repository.findActiveBySocioCaja(payload.socioId, payload.cajaId);
    if (contratoActivo) {
      throw new ServiceError(409, 'Ya existe un contrato activo para este socio y caja');
    }

    const fechaInicio = payload.fechaInicio || this.todayDateOnly();
    const socioNombre =
      payload.socioNombre ||
      `${(socio as any).socio_nombre || ''} ${(socio as any).socio_apellido || ''}`.trim() ||
      'Sin nombre';

    const contrato = await this.repository.create({
      contratoCofres_esSocioId: payload.socioId,
      contratoCofres_cajaId: payload.cajaId,
      contratoCofres_nombre: socioNombre,
      contratoCofres_dni: payload.socioDni || (socio as any).socio_dni || '',
      contratoCofres_domicilioFiscal: payload.domicilioFiscal || (socio as any).socio_domicilio || '',
      contratoCofres_cajaNumero: String(payload.cajaNumero ?? (caja as any).numero ?? ''),
      contratoCofres_cofreNumero: Number.isNaN(Number(payload.cajaNumero ?? (caja as any).numero))
        ? null
        : Number(payload.cajaNumero ?? (caja as any).numero),
      contratoCofres_estado: 'Pendiente de firma',
      contratoCofres_fechaContratacion: fechaInicio,
      contratoCofres_fechaVencimiento: null,
      contratoCofres_modificado: new Date(),
    });

    return this.toResponse(contrato);
  }

  async firmarContrato(id: number, payload: FirmarContratoPayload): Promise<ContratoCofreResponse> {
    const contrato = await this.repository.findById(id);
    if (!contrato) {
      throw new ServiceError(404, 'Contrato no encontrado');
    }

    if (contrato.contratoCofres_estado === 'Anulado') {
      throw new ServiceError(400, 'No se puede firmar un contrato anulado');
    }

    contrato.contratoCofres_firmaDigital = payload.firmaDigital;
    contrato.contratoCofres_firmante = payload.firmante;
    contrato.contratoCofres_fechaFirma = payload.fechaFirma ? new Date(payload.fechaFirma) : new Date();
    contrato.contratoCofres_estado = 'Firmado';
    contrato.contratoCofres_modificado = new Date();
    await contrato.save();

    return this.toResponse(contrato);
  }
}

export default ContratoCofresService;
