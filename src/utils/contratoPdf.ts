type PdfLine = { y: number; text: string };

const escapePdfText = (text: string): string =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const buildPdf = (lines: PdfLine[]): Buffer => {
  const content = [
    'BT',
    '/F1 12 Tf',
    ...lines.map((line) => `1 0 0 1 50 ${line.y} Tm (${escapePdfText(line.text)}) Tj`),
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> stream\n${content}\nendstream endobj`,
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

export const buildContratoPdf = (data: {
  id: number;
  socioId: number;
  socioNombre: string;
  socioDni: string;
  domicilioFiscal: string;
  cajaNumero: string;
  estado: string;
  fechaInicio: string;
  fechaFirma?: string | null;
  firmante?: string | null;
}): Buffer => {
  const lines: PdfLine[] = [
    { y: 790, text: `Contrato Caja de Seguridad #${data.id}` },
    { y: 760, text: `Socio: ${data.socioNombre}` },
    { y: 740, text: `DNI: ${data.socioDni}` },
    { y: 720, text: `Domicilio fiscal: ${data.domicilioFiscal}` },
    { y: 700, text: `Caja: ${data.cajaNumero}` },
    { y: 680, text: `Fecha inicio: ${data.fechaInicio}` },
    { y: 660, text: `Estado: ${data.estado}` },
  ];

  if (data.fechaFirma) {
    lines.push({ y: 640, text: `Fecha firma: ${data.fechaFirma}` });
  }
  if (data.firmante) {
    lines.push({ y: 620, text: `Firmante: ${data.firmante}` });
  }

  lines.push({ y: 560, text: 'Firma: __________________________' });
  return buildPdf(lines);
};
