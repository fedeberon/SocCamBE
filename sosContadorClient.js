/**
 * Cliente HTTP para SOS-Contador.
 *
 * Variables de entorno esperadas:
 * - SOS_API_BASE_URL=https://api.sos-contador.com
 * - SOS_AUTH_MODE=bearer | api_key | basic | none
 * - SOS_BEARER_TOKEN=token_estatico_opcional
 * - SOS_AUTH_ENDPOINT=/auth/login
 * - SOS_AUTH_USERNAME=usuario_login
 * - SOS_AUTH_PASSWORD=password_login
 * - SOS_API_KEY=tu_api_key
 * - SOS_API_SECRET=tu_api_secret_opcional
 * - SOS_API_KEY_HEADER=x-api-key
 * - SOS_API_SECRET_HEADER=x-api-secret
 * - SOS_API_TIMEOUT_MS=15000
 */

class SOSContadorClient {
  constructor(config = {}) {
    this.baseUrl = (config.baseUrl || process.env.SOS_API_BASE_URL || "").replace(/\/+$/, "");
    this.authMode = (config.authMode || process.env.SOS_AUTH_MODE || "none").toLowerCase();
    this.timeoutMs = Number(config.timeoutMs || process.env.SOS_API_TIMEOUT_MS || 15000);

    this.apiKey = config.apiKey || process.env.SOS_API_KEY || "";
    this.apiSecret = config.apiSecret || process.env.SOS_API_SECRET || "";
    this.apiKeyHeader = config.apiKeyHeader || process.env.SOS_API_KEY_HEADER || "x-api-key";
    this.apiSecretHeader = config.apiSecretHeader || process.env.SOS_API_SECRET_HEADER || "x-api-secret";

    this.staticBearerToken = config.bearerToken || process.env.SOS_BEARER_TOKEN || "";
    this.authEndpoint = config.authEndpoint || process.env.SOS_AUTH_ENDPOINT || "/auth/login";
    this.authUsername = config.authUsername || process.env.SOS_AUTH_USERNAME || "";
    this.authPassword = config.authPassword || process.env.SOS_AUTH_PASSWORD || "";

    this.cachedToken = null;
    this.cachedTokenExpiresAt = 0;

    if (!this.baseUrl) {
      throw new Error("Falta SOS_API_BASE_URL en variables de entorno");
    }
  }

  log(level, message, meta) {
    const payload = meta ? ` ${JSON.stringify(meta)}` : "";
    console[level](`[SOS] ${message}${payload}`);
  }

  async getAuthHeaders() {
    if (this.authMode === "none") return {};

    if (this.authMode === "api_key") {
      const headers = {};
      if (this.apiKey) headers[this.apiKeyHeader] = this.apiKey;
      if (this.apiSecret) headers[this.apiSecretHeader] = this.apiSecret;
      return headers;
    }

    if (this.authMode === "basic") {
      if (!this.authUsername || !this.authPassword) {
        throw new Error("SOS_AUTH_MODE=basic requiere SOS_AUTH_USERNAME y SOS_AUTH_PASSWORD");
      }
      const encoded = Buffer.from(`${this.authUsername}:${this.authPassword}`).toString("base64");
      return { Authorization: `Basic ${encoded}` };
    }

    if (this.authMode === "bearer") {
      const token = await this.getBearerToken();
      if (!token) {
        throw new Error("No se pudo obtener token bearer para SOS-Contador");
      }
      return { Authorization: `Bearer ${token}` };
    }

    throw new Error(`SOS_AUTH_MODE inválido: ${this.authMode}`);
  }

  async getBearerToken() {
    if (this.staticBearerToken) return this.staticBearerToken;

    const now = Date.now();
    if (this.cachedToken && now < this.cachedTokenExpiresAt) {
      return this.cachedToken;
    }

    if (!this.authUsername || !this.authPassword) {
      throw new Error(
        "Para bearer dinámico configurá SOS_AUTH_USERNAME/SOS_AUTH_PASSWORD o SOS_BEARER_TOKEN",
      );
    }

    const authUrl = this.buildUrl(this.authEndpoint);
    this.log("log", "Solicitando token de autenticación");

    const data = await this.fetchJson("POST", authUrl, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: this.authUsername,
        password: this.authPassword,
      }),
    });

    const token = data?.access_token || data?.token || data?.jwt || null;
    if (!token) {
      throw new Error("Respuesta de auth sin token (access_token/token/jwt)");
    }

    const expiresInSec = Number(data?.expires_in || 3600);
    this.cachedToken = token;
    this.cachedTokenExpiresAt = now + Math.max(expiresInSec - 60, 60) * 1000;
    return token;
  }

  buildUrl(path, query) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);
    if (query && typeof query === "object") {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          url.searchParams.set(k, String(v));
        }
      });
    }
    return url.toString();
  }

  async fetchJson(method, url, { headers, body } = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      const rawText = await response.text();
      let parsed;
      try {
        parsed = rawText ? JSON.parse(rawText) : null;
      } catch {
        parsed = rawText || null;
      }

      if (!response.ok) {
        const err = new Error(`SOS API ${response.status} ${response.statusText}`);
        err.status = response.status;
        err.details = parsed;
        throw err;
      }

      return parsed;
    } catch (error) {
      if (error.name === "AbortError") {
        const timeoutErr = new Error(`Timeout llamando a SOS API (${this.timeoutMs}ms)`);
        timeoutErr.status = 504;
        throw timeoutErr;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async request(method, path, { query, body, headers = {} } = {}) {
    const url = this.buildUrl(path, query);
    const authHeaders = await this.getAuthHeaders();
    const finalHeaders = {
      Accept: "application/json",
      ...authHeaders,
      ...headers,
    };

    let payload;
    if (body !== undefined) {
      finalHeaders["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }

    this.log("log", `${method} ${url}`);
    return this.fetchJson(method, url, { headers: finalHeaders, body: payload });
  }

  async getAsientos(queryParams = {}) {
    return this.request("GET", "/asientos", { query: queryParams });
  }

  async createAsiento(asientoPayload) {
    if (!asientoPayload || typeof asientoPayload !== "object") {
      throw new Error("El body para crear asiento debe ser un JSON válido");
    }
    return this.request("POST", "/asientos", { body: asientoPayload });
  }
}

module.exports = SOSContadorClient;
