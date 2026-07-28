import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

const logoPath = path.join(__dirname, '..', 'assets', 'LogoCamara.png');

const money = (value: number) =>
  `$${Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const buildFacturaPdf = async (data: {
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
}): Promise<Buffer> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.4, 0.4, 0.4);
  const blue = rgb(0.2, 0.35, 0.65);
  const lightGray = rgb(0.85, 0.85, 0.85);

  let y = 790;

  // Logo
  try {
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logo = await pdfDoc.embedPng(logoBytes);
      const logoWidth = 80;
      const logoHeight = (logo.height / logo.width) * logoWidth;
      const logoX = (595 - logoWidth) / 2;
      page.drawImage(logo, { x: logoX, y: y - logoHeight, width: logoWidth, height: logoHeight });
      y -= logoHeight + 15;
    }
  } catch {
    // Si falla el logo, sigue sin él
  }

  // Título
  page.drawText('Cámara Comercial e Industrial de Bolívar', {
    x: 50, y, size: 16, font: helveticaBold, color: blue,
  });
  y -= 25;

  page.drawText('Comprobante de Movimiento', {
    x: 50, y, size: 14, font: helveticaBold, color: black,
  });
  y -= 10;

  // Línea separadora
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: lightGray });
  y -= 25;

  // Fecha
  const fechaFormateada = data.fecha
    ? new Date(data.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';
  page.drawText(`Fecha: ${fechaFormateada}`, { x: 50, y, size: 12, font: helvetica, color: black });
  y -= 30;

  // Sección: Datos del comprobante
  page.drawText('DATOS DEL COMPROBANTE', { x: 50, y, size: 12, font: helveticaBold, color: blue });
  y -= 5;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: lightGray });
  y -= 20;

  const fields = [
    ['Tipo', data.documento || '—'],
    ['Comprobante', data.comprobante || '—'],
    ['Detalle', data.detalle || '—'],
    ['Tipo de movimiento', data.tipo || '—'],
    ['Estado', data.movimiento || '—'],
  ];

  for (const [label, value] of fields) {
    page.drawText(`${label}:`, { x: 60, y, size: 10, font: helveticaBold, color: gray });
    page.drawText(value, { x: 200, y, size: 10, font: helvetica, color: black });
    y -= 18;
  }

  y -= 10;

  // Sección: Importes
  page.drawText('IMPORTES', { x: 50, y, size: 12, font: helveticaBold, color: blue });
  y -= 5;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: lightGray });
  y -= 22;

  page.drawText('Importe:', { x: 60, y, size: 11, font: helveticaBold, color: gray });
  page.drawText(money(data.importe || 0), { x: 200, y, size: 13, font: helveticaBold, color: black });
  y -= 22;

  page.drawText('Saldo:', { x: 60, y, size: 11, font: helveticaBold, color: gray });
  page.drawText(money(data.saldo || 0), { x: 200, y, size: 13, font: helveticaBold, color: black });
  y -= 30;

  // Sección: Estado
  page.drawText('ESTADO', { x: 50, y, size: 12, font: helveticaBold, color: blue });
  y -= 5;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: lightGray });
  y -= 22;

  const estadoColor = data.estado === 'Pendiente' ? rgb(0.8, 0.2, 0.2) : rgb(0.1, 0.6, 0.3);
  page.drawText(data.estado || '—', { x: 60, y, size: 12, font: helveticaBold, color: estadoColor });
  y -= 30;

  // Datos del socio
  if (data.socioNombre || data.socioId) {
    page.drawText('SOCIO', { x: 50, y, size: 12, font: helveticaBold, color: blue });
    y -= 5;
    page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: lightGray });
    y -= 20;

    if (data.socioNombre) {
      page.drawText(`Nombre: ${data.socioNombre}`, { x: 60, y, size: 10, font: helvetica, color: black });
      y -= 18;
    }
    if (data.socioId) {
      page.drawText(`ID Socio: ${data.socioId}`, { x: 60, y, size: 10, font: helvetica, color: black });
      y -= 18;
    }
  }

  // Footer
  y -= 30;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: lightGray });
  y -= 15;

  page.drawText('Documento generado automáticamente por SocCam', {
    x: 50, y, size: 8, font: helvetica, color: gray,
  });
  y -= 12;
  page.drawText(`Fecha de emisión: ${new Date().toLocaleString('es-AR')}`, {
    x: 50, y, size: 8, font: helvetica, color: gray,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
