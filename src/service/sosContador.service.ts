import http from 'http';
import https from 'https';

type SosLoginCuit = {
  id: number;
  cuit: string;
  razonsocial?: string;
};

type SosLoginResponse = {
  jwt: string;
  idusuario?: number;
  cuits?: SosLoginCuit[];
};

type SosCuitCredentialsResponse = {
  jwt: string;
};

type SosClienteListadoItem = {
  id: number;
  cuit: string;
  clipro: string;
  email?: string;
  idprovincia?: number;
  domicilio?: string;
  idcondicioniva?: number;
};

type SosClienteListadoResponse = {
  paginas: number;
  items: SosClienteListadoItem[];
};

type GetSociosByCuitOptions = {
  pagina?: number;
  registros?: number;
  cliente?: boolean;
  proveedor?: boolean;
};

type FindSocioByCuitOptions = {
  socioCuit: string;
  cliente?: boolean;
  proveedor?: boolean;
};

type SosCobroItem = {
  id: number;
  fecha: string;
  factura?: string;
  montototal?: number;
  referencia?: string;
  cliente?: {
    id: number;
    cuit: string;
    clipro: string;
    email?: string;
  };
};

type SosCobroListadoResponse = {
  items?: SosCobroItem[];
  error?: string;
};

type GetCobrosBySocioCuitOptions = {
  socioCuit: string;
  periodo?: string;
  registros?: string | number;
  maxPaginas?: string | number;
};

type SosCuentaCorrienteItem = {
  idcomprobante?: string | number;
  idtipo_operacion?: number;
  idclipro?: string | number;
  fecha?: string;
  clipro?: string;
  fcncnd?: string | null;
  letra?: string | null;
  sucursal?: number | null;
  numero?: number | null;
  memo?: string | null;
  afip_moneda?: string | null;
  montodebe?: number | null;
  montohaber?: number | null;
  montosaldo?: number | null;
  estadoasociacion?: number | null;
  [key: string]: any;
};

type SosCuentaCorrienteResponse = {
  items?: SosCuentaCorrienteItem[];
  error?: string;
};

type GetMovimientosCuentaCorrienteBySocioCuitOptions = {
  socioCuit: string;
  fechaDesde?: string;
  fechaHasta?: string;
  cp?: 'C' | 'P';
  tipo?: 'T' | 'D' | 'H';
};

class SosContadorService {
  private readonly rawBaseUrl = (process.env.SOS_API_BASE_URL || 'https://api.sos-contador.com').trim();
  private readonly baseUrl = this.normalizeBaseUrl(this.rawBaseUrl);
  private readonly authUser = process.env.SOS_AUTH_USERNAME || process.env.SOS_AUTH_USER || '';
  private readonly authPassword = process.env.SOS_AUTH_PASSWORD || '';
  private readonly representedCuit = process.env.SOS_REPRESENTED_CUIT || '';
  private readonly timeoutMs = Number(process.env.SOS_API_TIMEOUT_MS || 15000);

  private sanitizeCuit(value: string): string {
    return (value || '').replace(/\D/g, '');
  }

  private normalizeBaseUrl(value: string): string {
    const trimmed = String(value || '').trim().replace(/\/+$/, '');
    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`Protocolo no soportado: ${parsed.protocol}`);
      }
      return parsed.toString().replace(/\/+$/, '');
    } catch (error: any) {
      throw new Error(`SOS_API_BASE_URL inválida: "${trimmed}" (${error?.message || 'formato inválido'})`);
    }
  }

  private parseBoolean(value: boolean | undefined, fallback: boolean): boolean {
    if (typeof value === 'boolean') return value;
    return fallback;
  }

  private ensurePeriodo(periodo?: string): 'hoy' | 'ayer' | 'semana' | 'mes' | 'mes_anterior' {
    const normalized = String(periodo || 'mes').trim().toLowerCase();
    const allowed = new Set(['hoy', 'ayer', 'semana', 'mes', 'mes_anterior']);
    if (!allowed.has(normalized)) {
      throw new Error('Período inválido. Valores permitidos: hoy, ayer, semana, mes, mes_anterior');
    }
    return normalized as 'hoy' | 'ayer' | 'semana' | 'mes' | 'mes_anterior';
  }

  private parsePositiveInt(value: string | number | undefined, fallback: number, min: number, max: number): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(Math.trunc(parsed), max));
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>) {
    const url = new URL(`${this.baseUrl}${path}`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async request<T>(method: 'GET' | 'POST', path: string, payload?: {
    token?: string;
    body?: Record<string, unknown>;
    query?: Record<string, string | number | boolean | undefined>;
  }): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (payload?.token) {
        headers.Authorization = `Bearer ${payload.token}`;
      }
      if (payload?.body) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(this.buildUrl(path, payload?.query), {
        method,
        headers,
        body: payload?.body ? JSON.stringify(payload.body) : undefined,
        signal: controller.signal,
      });

      const raw = await response.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        const bodyPreview = raw.length > 500 ? raw.slice(0, 500) + '...' : raw;
        throw new Error(`SOS API respondió con HTML (status ${response.status}) en ${method} ${path}. Body: ${bodyPreview}`);
      }

      if (!response.ok || (data && typeof data === 'object' && 'error' in data)) {
        const message = (data as any)?.error || `SOS API error ${response.status}`;
        throw new Error(message);
      }

      return data as T;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(`Timeout llamando a SOS API (${this.timeoutMs}ms)`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private async requestGetWithJsonBody<T>(path: string, token: string, body: Record<string, unknown>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    const payload = JSON.stringify(body || {});
    const client = url.protocol === 'https:' ? https : http;

    return new Promise<T>((resolve, reject) => {
      const req = client.request(
        {
          method: 'GET',
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: `${url.pathname}${url.search}`,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: this.timeoutMs,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            let data: any = null;
            try {
              data = raw ? JSON.parse(raw) : null;
            } catch {
              return reject(new Error(`Respuesta inválida de SOS API: ${raw.slice(0, 200)}`));
            }

            if ((res.statusCode || 500) >= 400 || (data && typeof data === 'object' && 'error' in data)) {
              return reject(new Error(data?.error || `SOS API error ${res.statusCode}`));
            }

            return resolve(data as T);
          });
        },
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy(new Error(`Timeout llamando a SOS API (${this.timeoutMs}ms)`));
      });
      req.write(payload);
      req.end();
    });
  }

  private async login(): Promise<SosLoginResponse> {
    if (!this.authUser || !this.authPassword) {
      throw new Error('Faltan SOS_AUTH_USERNAME/SOS_AUTH_PASSWORD para autenticar con SOS Contador');
    }

    return this.request<SosLoginResponse>('POST', '/api-comunidad/login', {
      body: {
        usuario: this.authUser,
        password: this.authPassword,
      },
    });
  }

  private async getTokenByCuit(cuitRepresentado: string): Promise<string> {
    const normalizedCuit = this.sanitizeCuit(cuitRepresentado);
    if (normalizedCuit.length !== 11) {
      throw new Error('El CUIT debe tener 11 dígitos');
    }

    const loginResponse = await this.login();
    const availableCuits = loginResponse.cuits || [];
    const selected = availableCuits.find((item) => this.sanitizeCuit(item.cuit) === normalizedCuit);

    if (!selected) {
      throw new Error(`No tenés permisos para operar el CUIT ${normalizedCuit} en SOS Contador`);
    }

    const credentials = await this.request<SosCuitCredentialsResponse>(
      'GET',
      `/api-comunidad/cuit/credentials/${selected.id}`,
      { token: loginResponse.jwt },
    );

    if (!credentials?.jwt) {
      throw new Error('No se pudo obtener JWT para el CUIT seleccionado');
    }

    return credentials.jwt;
  }

  async getSociosByCuit(cuitRepresentado: string, options: GetSociosByCuitOptions = {}): Promise<SosClienteListadoResponse> {
    const jwt = await this.getTokenByCuit(cuitRepresentado);

    return this.request<SosClienteListadoResponse>('GET', '/api-comunidad/cliente/listado', {
      token: jwt,
      query: {
        proveedor: this.parseBoolean(options.proveedor, true),
        cliente: this.parseBoolean(options.cliente, true),
        registros: options.registros || 50,
        pagina: options.pagina || 1,
      },
    });
  }

  private async getTokenByRepresentedCuit(cuitRepresentado?: string): Promise<string> {
    const envRepresentedCuit = this.sanitizeCuit(this.representedCuit);
    const explicitCuit = this.sanitizeCuit(cuitRepresentado || '');
    const resolvedCuit = explicitCuit || envRepresentedCuit;

    if (resolvedCuit) {
      return this.getTokenByCuit(resolvedCuit);
    }

    const loginResponse = await this.login();
    const firstCuit = loginResponse.cuits?.[0];
    if (!firstCuit?.id) {
      throw new Error('No hay CUITs disponibles en la cuenta de SOS Contador');
    }

    const credentials = await this.request<SosCuitCredentialsResponse>(
      'GET',
      `/api-comunidad/cuit/credentials/${firstCuit.id}`,
      { token: loginResponse.jwt },
    );

    if (!credentials?.jwt) {
      throw new Error('No se pudo obtener JWT para el CUIT representado');
    }

    return credentials.jwt;
  }

  async findSocioByCuit(options: FindSocioByCuitOptions): Promise<SosClienteListadoItem | null> {
    const normalizedSocioCuit = this.sanitizeCuit(options.socioCuit);
    if (normalizedSocioCuit.length !== 11) {
      throw new Error('El CUIT del socio debe tener 11 dígitos');
    }

    const token = await this.getTokenByRepresentedCuit();
    const cliente = this.parseBoolean(options.cliente, true);
    const proveedor = this.parseBoolean(options.proveedor, true);

    let response = await this.request<SosClienteListadoResponse>('GET', '/api-comunidad/cliente/listado', {
      token,
      query: {
        proveedor,
        cliente,
        pagina: 1,
        registros: 20,
        txbuscar: normalizedSocioCuit,
      } as Record<string, string | number | boolean | undefined>,
    });

    let found = (response.items || []).find(
      (item) => this.sanitizeCuit(item.cuit) === normalizedSocioCuit,
    );

    if (!found) {
      // Fallback: txbuscar busca por nombre/razón social, no por CUIT.
      // Iteramos páginas hasta encontrar el socio o que no haya más resultados.
      const registrosPorPagina = 50;
      for (let page = 1; ; page++) {
        response = await this.request<SosClienteListadoResponse>('GET', '/api-comunidad/cliente/listado', {
          token,
          query: {
            proveedor,
            cliente,
            pagina: page,
            registros: registrosPorPagina,
          } as Record<string, string | number | boolean | undefined>,
        });

        found = (response.items || []).find(
          (item) => this.sanitizeCuit(item.cuit) === normalizedSocioCuit,
        );

        if (found) break;
        if ((response.items || []).length < registrosPorPagina) break;
      }
    }

    return found || null;
  }

  async getCobrosBySocioCuit(options: GetCobrosBySocioCuitOptions): Promise<SosCobroItem[]> {
    const normalizedSocioCuit = this.sanitizeCuit(options.socioCuit);
    if (normalizedSocioCuit.length !== 11) {
      throw new Error('El CUIT del socio debe tener 11 dígitos');
    }

    const periodo = this.ensurePeriodo(options.periodo);
    const token = await this.getTokenByRepresentedCuit();
    const registros = this.parsePositiveInt(options.registros, 100, 1, 500);
    const maxPaginas = this.parsePositiveInt(options.maxPaginas, 20, 1, 100);

    const cobros: SosCobroItem[] = [];
    const dedupe = new Set<string>();

    for (let pagina = 1; pagina <= maxPaginas; pagina += 1) {
      const response = await this.request<SosCobroListadoResponse>('GET', `/api-comunidad/cobro/listado/${periodo}`, {
        token,
        query: { pagina, registros },
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      const items = response?.items || [];
      for (const item of items) {
        const itemCuit = this.sanitizeCuit(item?.cliente?.cuit || '');
        if (itemCuit !== normalizedSocioCuit) {
          continue;
        }

        const dedupeKey = String(
          item?.id || `${item?.fecha || ''}|${item?.factura || ''}|${item?.montototal || ''}|${item?.cliente?.id || ''}`,
        );

        if (dedupe.has(dedupeKey)) {
          continue;
        }

        dedupe.add(dedupeKey);
        cobros.push(item);
      }

      if (items.length < registros) {
        break;
      }
    }

    return cobros.sort((a, b) => {
      const aTime = new Date(a.fecha || 0).getTime();
      const bTime = new Date(b.fecha || 0).getTime();
      return bTime - aTime;
    });
  }

  async getMovimientosCuentaCorrienteBySocioCuit(
    options: GetMovimientosCuentaCorrienteBySocioCuitOptions,
  ): Promise<SosCuentaCorrienteItem[]> {
    const normalizedSocioCuit = this.sanitizeCuit(options.socioCuit);
    if (normalizedSocioCuit.length !== 11) {
      throw new Error('El CUIT/CUIL del socio debe tener 11 dígitos');
    }

    const token = await this.getTokenByRepresentedCuit();

    let sociosResponse = await this.request<SosClienteListadoResponse>('GET', '/api-comunidad/cliente/listado', {
      token,
      query: {
        proveedor: true,
        cliente: true,
        pagina: 1,
        registros: 50,
        txbuscar: normalizedSocioCuit,
      } as Record<string, string | number | boolean | undefined>,
    });

    let candidateSocios = (sociosResponse.items || []).filter(
      (item) => this.sanitizeCuit(item.cuit) === normalizedSocioCuit && Number(item.id) > 0,
    );

    if (!candidateSocios.length) {
      const registrosPorPagina = 50;
      for (let page = 1; ; page++) {
        sociosResponse = await this.request<SosClienteListadoResponse>('GET', '/api-comunidad/cliente/listado', {
          token,
          query: {
            proveedor: true,
            cliente: true,
            pagina: page,
            registros: registrosPorPagina,
          } as Record<string, string | number | boolean | undefined>,
        });

        candidateSocios = (sociosResponse.items || []).filter(
          (item) => this.sanitizeCuit(item.cuit) === normalizedSocioCuit && Number(item.id) > 0,
        );

        if (candidateSocios.length) break;
        if ((sociosResponse.items || []).length < registrosPorPagina) break;
      }
    }

    if (!candidateSocios.length) {
      return [];
    }

    const today = new Date();
    const defaultDesde = `${today.getFullYear() - 1}-01-01`;
    const defaultHasta = `${today.getFullYear()}-12-31`;

    const cpValues: Array<'C' | 'P'> = options.cp ? [options.cp] : ['C'];
    const tipoValues: Array<'T' | 'D' | 'H'> = options.tipo ? [options.tipo] : ['T'];

    const dedupe = new Set<string>();
    const movements: SosCuentaCorrienteItem[] = [];

    for (const socio of candidateSocios) {
      for (const cpValue of cpValues) {
        for (const tipoValue of tipoValues) {
          try {
            const body = {
              CP: cpValue,
              fechadesde: options.fechaDesde || defaultDesde,
              fechahasta: options.fechaHasta || defaultHasta,
              tipo: tipoValue,
              idclipro: socio.id,
            };

            const response = await this.requestGetWithJsonBody<SosCuentaCorrienteResponse>(
              '/api-comunidad/cuentacorriente/listado',
              token,
              body,
            );

            if (response?.error) {
              continue;
            }

            for (const item of response?.items || []) {
              const key = String(
                `${socio.id}|${item?.idcomprobante || ''}|${item?.fecha || ''}|${item?.numero || ''}|${item?.montodebe || ''}|${item?.montohaber || ''}`,
              );
              if (dedupe.has(key)) continue;
              dedupe.add(key);
              movements.push(item);
            }
          } catch {
            // SOS tiene combinaciones CP/tipo que responden error; las omitimos para devolver todo lo disponible.
          }
        }
      }
    }

    return movements.sort((a, b) => {
      const aTime = new Date(a.fecha || 0).getTime();
      const bTime = new Date(b.fecha || 0).getTime();
      return bTime - aTime;
    });
  }
}

export default new SosContadorService();
