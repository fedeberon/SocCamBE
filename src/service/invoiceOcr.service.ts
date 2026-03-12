import azureBlobService from './azureBlob.service';
import logger from '../configs/logger';

type AzureReadLine = { text: string };

type AzureReadResult = {
  status?: string;
  analyzeResult?: {
    readResults?: Array<{
      lines?: AzureReadLine[];
    }>;
  };
};

class InvoiceOcrService {
  private endpoint = String(process.env.AZURE_CV_ENDPOINT || '').replace(/\/$/, '');
  private key = String(process.env.AZURE_CV_KEY || '');
  private apiVersion = String(process.env.AZURE_CV_API_VERSION || 'v3.2');

  private ensureConfig() {
    if (!this.endpoint || !this.key) {
      throw new Error('Falta configuración Azure OCR (AZURE_CV_ENDPOINT / AZURE_CV_KEY)');
    }
  }

  private normalizeMoney(raw: string | null | undefined): number | null {
    if (!raw) return null;
    const cleaned = raw.replace(/[^0-9,.-]/g, '');
    if (!cleaned) return null;

    const normalized = cleaned.includes(',')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned;

    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  private extractFields(lines: string[]) {
    const all = lines.join('\n');

    const clean = (v: string | null | undefined) =>
      String(v || '')
        .replace(/\s+/g, ' ')
        .replace(/[|]+/g, ' ')
        .trim()
        .slice(0, 180);

    const pickByLabel = (patterns: RegExp[]) => {
      for (const p of patterns) {
        const m = all.match(p);
        const value = clean(m?.[1]);
        if (value) return value;
      }
      return null;
    };

    const holderName =
      pickByLabel([
        /(?:^|\n)\s*Apellido\s+y\s+Nombre\s*\/\s*Raz[oó]n\s+Social\s*:?\s*([^\n\r]{3,180})/i,
        /(?:^|\n)\s*Raz[oó]n\s+Social\s*:?\s*([^\n\r]{3,180})/i,
        /(?:^|\n)\s*Titular\s*:?\s*([^\n\r]{3,180})/i,
      ]) || null;

    const dueDate =
      clean(all.match(/(?:Venc(?:imiento)?|Vto\.?)[^\d]{0,10}(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1]) ||
      null;

    const fiscalCondition =
      pickByLabel([/(?:^|\n)\s*(?:Condici[oó]n\s+Fiscal|IVA)\s*:?\s*([^\n\r]{2,120})/i]) || null;

    const address =
      pickByLabel([
        /(?:^|\n)\s*Domicilio\s*(?:de\s*suministro)?\s*:?\s*([^\n\r]{3,180})/i,
        /(?:^|\n)\s*Direcci[oó]n\s*:?\s*([^\n\r]{3,180})/i,
      ]) || null;

    let totalAmount: number | null = null;

    const totalRegexes = [
      /(?:TOTAL\s*[:]?\s*)([\$\s0-9\.,-]+)/i,
      /(?:IMPORTE\s+TOTAL\s*[:]?\s*)([\$\s0-9\.,-]+)/i,
      /(?:TOTAL\s+A\s+PAGAR\s*[:]?\s*)([\$\s0-9\.,-]+)/i,
    ];

    for (const rgx of totalRegexes) {
      const m = all.match(rgx);
      const v = this.normalizeMoney(m?.[1]);
      if (v && v > 0) {
        totalAmount = v;
        break;
      }
    }

    if (!totalAmount) {
      const candidates = [...all.matchAll(/\b\d{1,3}(?:\.\d{3})*(?:,\d{2})\b/g)]
        .map((m) => this.normalizeMoney(m[0]))
        .filter((n): n is number => Number.isFinite(n as number) && (n as number) > 0);

      if (candidates.length) totalAmount = candidates[candidates.length - 1];
    }

    return { holderName, totalAmount, dueDate, fiscalCondition, address };
  }

  private calculatePoints(totalAmount: number | null) {
    if (!Number.isFinite(totalAmount as number) || (totalAmount as number) <= 0) return 0;
    // Regla pedida: 1 punto = $1
    return Math.floor(totalAmount as number);
  }

  private async pollResult(operationLocation: string) {
    for (let i = 0; i < 15; i++) {
      const resp = await fetch(operationLocation, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': this.key,
        },
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Azure OCR poll error (${resp.status}): ${txt}`);
      }

      const data = (await resp.json()) as AzureReadResult;
      if (data.status === 'succeeded') return data;
      if (data.status === 'failed') throw new Error('Azure OCR devolvió failed');

      await new Promise((r) => setTimeout(r, 1200));
    }

    throw new Error('Timeout esperando resultado OCR');
  }

  async scanInvoiceImage(imageBuffer: Buffer, opts?: { socioId?: number; fileName?: string; contentType?: string }) {
    this.ensureConfig();

    const socioId = Number(opts?.socioId || 0) || 0;
    const blobFileName = opts?.fileName || `factura-${Date.now()}.jpg`;
    const blobUrl = await azureBlobService.subirArchivo({
      buffer: imageBuffer,
      nombreArchivo: blobFileName,
      carpeta: 'facturas-ocr',
      entidadId: socioId > 0 ? socioId : 'anon',
      subcarpeta: new Date().toISOString().slice(0, 10),
      contentType: opts?.contentType || 'image/jpeg',
    });

    const submitUrl = `${this.endpoint}/vision/${this.apiVersion}/read/analyze`;
    const submitResp = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.key,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer as unknown as BodyInit,
    });

    if (submitResp.status !== 202) {
      const txt = await submitResp.text();
      throw new Error(`Azure OCR submit error (${submitResp.status}): ${txt}`);
    }

    const operationLocation = submitResp.headers.get('operation-location');
    if (!operationLocation) throw new Error('No se recibió operation-location desde Azure OCR');

    const ocrResult = await this.pollResult(operationLocation);
    const lines = (ocrResult.analyzeResult?.readResults || []).flatMap((p) => p.lines || []).map((l) => l.text);

    const { holderName, totalAmount, dueDate, fiscalCondition, address } = this.extractFields(lines);
    const awarded = this.calculatePoints(totalAmount);

    logger.info('[invoiceOcr] parser result', {
      socioId,
      fileName: blobFileName,
      linesCount: lines.length,
      holderName: holderName || null,
      totalAmount: totalAmount || null,
      dueDate: dueDate || null,
      fiscalCondition: fiscalCondition || null,
      address: address || null,
      awarded,
      sampleLines: lines.slice(0, 12),
    });

    return {
      status: holderName && totalAmount ? 'approved' : 'needs_review',
      invoice: {
        holderName,
        customerName: holderName,
        totalAmount,
        dueDate,
        fiscalCondition,
        address,
        customerAddress: address,
      },
      points: {
        awarded,
        rule: '1 punto = $1',
      },
      ocr: {
        linesCount: lines.length,
        lines,
        rawText: lines.join('\n'),
      },
      storage: {
        imageUrl: blobUrl,
      },
    };
  }
}

export default new InvoiceOcrService();
