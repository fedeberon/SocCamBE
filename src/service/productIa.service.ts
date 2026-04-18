import logger from '../configs/logger';

type AzureReadLine = { text: string };
type AzureReadResult = {
  status?: string;
  analyzeResult?: { readResults?: Array<{ lines?: AzureReadLine[] }> };
};

class ProductIaService {
  private endpoint = String(process.env.AZURE_CV_ENDPOINT || '').replace(/\/$/, '');
  private key = String(process.env.AZURE_CV_KEY || '');
  private apiVersion = String(process.env.AZURE_CV_API_VERSION || 'v3.2');

  private ensureConfig() {
    if (!this.endpoint || !this.key) {
      throw new Error('Falta configuración Azure CV (AZURE_CV_ENDPOINT / AZURE_CV_KEY)');
    }
  }

  private normalizeMoney(raw: string | null | undefined): number | null {
    if (!raw) return null;
    const cleaned = raw.replace(/[^0-9,.-]/g, '');
    if (!cleaned) return null;
    const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  private async pollResult(operationLocation: string) {
    for (let i = 0; i < 15; i++) {
      const resp = await fetch(operationLocation, {
        method: 'GET',
        headers: { 'Ocp-Apim-Subscription-Key': this.key },
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Azure CV poll error (${resp.status}): ${txt}`);
      }

      const data = (await resp.json()) as AzureReadResult;
      if (data.status === 'succeeded') return data;
      if (data.status === 'failed') throw new Error('Azure CV devolvió failed');
      await new Promise((r) => setTimeout(r, 1200));
    }

    throw new Error('Timeout esperando resultado Azure CV');
  }

  private estimatePriceFromText(lines: string[], rubro: string): number {
    const all = lines.join(' \n ');
    const matches = [...all.matchAll(/\$?\s?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g)]
      .map((m) => this.normalizeMoney(m[0]))
      .filter((n): n is number => Number.isFinite(n as number) && (n as number) > 200 && (n as number) < 5000000);

    if (matches.length) {
      const sorted = matches.sort((a, b) => a - b);
      return Math.round(sorted[Math.floor(sorted.length / 2)]);
    }

    const baseByRubro: Record<string, number> = {
      indumentaria: 18000,
      gastronomia: 9500,
      tecnologia: 65000,
      hogar: 23000,
      belleza: 14000,
      artesania: 12000,
      servicios: 25000,
      general: 15000,
    };
    const key = String(rubro || 'general').toLowerCase();
    return baseByRubro[key] || 15000;
  }

  private buildMarketingDescription(params: {
    nombreMarca: string;
    rubro: string;
    title: string;
    lines: string[];
    estimatedPrice: number;
  }): string {
    const bullets = params.lines
      .filter((l) => l && l.trim().length > 3)
      .slice(0, 5)
      .map((l) => `• ${l.trim()}`)
      .join('\n');

    const cierre = `Ideal para ${params.rubro || 'uso diario'}. Publicado por ${params.nombreMarca}.\nPrecio sugerido de referencia: $${Number(params.estimatedPrice || 0).toLocaleString('es-AR')}.`;

    return [
      `${params.title}.`,
      'Producto con excelente presencia para vidriera digital y ventas por catálogo.',
      bullets || '• Calidad y terminaciones cuidadas\n• Disponibilidad sujeta a stock\n• Consultar variantes y colores',
      cierre,
    ]
      .filter(Boolean)
      .join('\n\n')
      .slice(0, 1000);
  }

  async suggestProductFromImage(input: {
    imageBuffer?: Buffer;
    fileName?: string;
    nombreMarca?: string;
    rubro?: string;
  }) {
    const nombreMarca = String(input.nombreMarca || 'Tu marca').trim();
    const rubro = String(input.rubro || 'general').trim().toLowerCase();
    const baseName = String(input.fileName || 'producto')
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    let lines: string[] = [];
    let confidence = 0.7;

    if (input.imageBuffer && input.imageBuffer.length > 0) {
      this.ensureConfig();
      const submitUrl = `${this.endpoint}/vision/${this.apiVersion}/read/analyze`;
      const submitResp = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.key,
          'Content-Type': 'application/octet-stream',
        },
        body: input.imageBuffer as unknown as BodyInit,
      });

      if (submitResp.status !== 202) {
        const txt = await submitResp.text();
        throw new Error(`Azure CV submit error (${submitResp.status}): ${txt}`);
      }

      const operationLocation = submitResp.headers.get('operation-location');
      if (!operationLocation) throw new Error('No se recibió operation-location desde Azure CV');

      const ocrResult = await this.pollResult(operationLocation);
      lines = (ocrResult.analyzeResult?.readResults || [])
        .flatMap((p) => p.lines || [])
        .map((l) => String(l.text || '').trim())
        .filter(Boolean);
      confidence = lines.length > 0 ? 0.86 : 0.72;
    }

    const ocrNameCandidate = lines.find((l) => l.length >= 4 && l.length <= 70 && !/\$|\d{4,}/.test(l));
    const titulo = (ocrNameCandidate || baseName || `Producto de ${nombreMarca}`).replace(/\s+/g, ' ').trim();
    const precio_sugerido = this.estimatePriceFromText(lines, rubro);
    const descripcion = this.buildMarketingDescription({
      nombreMarca,
      rubro,
      title: titulo,
      lines,
      estimatedPrice: precio_sugerido,
    });

    logger.info('[productIa] suggestion generated', {
      nombreMarca,
      rubro,
      titulo,
      precio_sugerido,
      linesCount: lines.length,
      confidence,
    });

    return {
      titulo: titulo.slice(0, 220),
      descripcion,
      precio_sugerido,
      categoria: rubro || 'general',
      confianza: Number(confidence.toFixed(2)),
      ocr: {
        linesCount: lines.length,
        lines: lines.slice(0, 30),
      },
    };
  }
}

export default new ProductIaService();
