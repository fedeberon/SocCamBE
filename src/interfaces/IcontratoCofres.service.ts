export interface ContratoCofreResponse {
  id: number;
  socioId: number;
  socioNombre: string;
  socioDni: string;
  domicilioFiscal: string;
  cajaId: number;
  cajaNumero: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string | null;
  firmaDigital: string | null;
  firmante: string | null;
  fechaFirma: string | null;
}

export interface CreateContratoCofrePayload {
  socioId: number;
  cajaId: number;
  socioNombre?: string;
  socioDni?: string;
  domicilioFiscal?: string;
  cajaNumero?: string;
  fechaInicio?: string;
}

export interface FirmarContratoPayload {
  firmante: string;
  firmaDigital: string;
  fechaFirma?: string;
}

export interface IContratoCofresService {
  getAllContratoCofres(): Promise<ContratoCofreResponse[]>;
  getContratoCofresById(id: number): Promise<ContratoCofreResponse | null>;
  getContratoCofressBySocioId(socioId: number): Promise<ContratoCofreResponse[]>;
  createContratoCofre(payload: CreateContratoCofrePayload): Promise<ContratoCofreResponse>;
  firmarContrato(id: number, payload: FirmarContratoPayload): Promise<ContratoCofreResponse>;
}
