type PdfLine = { y: number; text: string; size?: number; bold?: boolean };

const escapePdfText = (text: string): string =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const buildPdf = (lines: PdfLine[], title: string): Buffer => {
  const headerLines: PdfLine[] = [
    { y: 800, text: 'Cámara Comercial e Industrial de Bolívar', size: 14, bold: true },
    { y: 778, text: title, size: 16, bold: true },
    { y: 758, text: '─'.repeat(60), size: 10 },
  ];

  const allLines = [...headerLines, ...lines];

  const content = [
    'BT',
    ...allLines.map((line) => {
      const size = line.size || 11;
      const font = line.bold ? '/F2' : '/F1';
      return `${font} ${size} Tf 1 0 0 1 50 ${line.y} Tm (${escapePdfText(line.text)}) Tj`;
    }),
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj',
    `6 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> stream\n${content}\nendstream endobj`,
  ];

  let output = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(output, 'utf8'));
    output += `${obj}\n`;
  }

  const xrefOffset = Buffer.byteLength(output, 'utf8');
  output += `xref\n0 ${objects.length + 1}\n`;
  output += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    output += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  output += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(output, 'utf8');
};

const money = (value: number) =>
  `$${Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const buildFacturaPdf = (data: {
  fecha?: string;
  documento?: string;
  comprobante?: string;
  detalle?: string;
  tipo?: string;
  movimiento?: string;
  importe?: number;
  saldo?: number;
  estado?: string;
  socioNombre?: string;
  socioId?: number;
}): Buffer => {
  const fechaFormateada = data.fecha
    ? new Date(data.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const lines: PdfLine[] = [
    { y: 730, text: `Fecha: ${fechaFormateada}`, size: 12 },
    { y: 710, text: '─'.repeat(60), size: 8 },
    { y: 690, text: 'DATOS DEL COMPROBANTE', size: 12, bold: true },
    { y: 670, text: `Tipo: ${data.documento || '—'}`, size: 11 },
    { y: 650, text: `Comprobante: ${data.comprobante || '—'}`, size: 11 },
    { y: 630, text: `Detalle: ${data.detalle || '—'}`, size: 11 },
    { y: 610, text: `Tipo de movimiento: ${data.tipo || '—'}`, size: 11 },
    { y: 590, text: `Estado: ${data.movimiento || '—'}`, size: 11 },
    { y: 560, text: '─'.repeat(60), size: 8 },
    { y: 540, text: 'IMPORTES', size: 12, bold: true },
    { y: 520, text: `Importe: ${money(data.importe || 0)}`, size: 12 },
    { y: 500, text: `Saldo: ${money(data.saldo || 0)}`, size: 12 },
    { y: 470, text: '─'.repeat(60), size: 8 },
    { y: 450, text: `Estado: ${data.estado || '—'}`, size: 11, bold: true },
  ];

  if (data.socioNombre) {
    lines.push({ y: 420, text: `Socio: ${data.socioNombre}`, size: 11 });
  }
  if (data.socioId) {
    lines.push({ y: 400, text: `ID Socio: ${data.socioId}`, size: 11 });
  }

  lines.push(
    { y: 350, text: '─'.repeat(60), size: 8 },
    { y: 330, text: 'Documento generado automáticamente por SocCam', size: 9 },
    { y: 310, text: `Fecha de emisión: ${new Date().toLocaleString('es-AR')}`, size: 9 },
  );

  return buildPdf(lines, 'Comprobante de Movimiento');
};
