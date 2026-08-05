import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

const money = (value: number) =>
  `$${Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

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

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const page = pdfDoc.addPage([595, 842]);
  const { width } = page.getSize();

  const primaryColor = rgb(0.15, 0.30, 0.55);
  const accentColor = rgb(0.85, 0.45, 0.15);
  const lightGray = rgb(0.93, 0.93, 0.93);
  const darkText = rgb(0.15, 0.15, 0.15);
  const mediumGray = rgb(0.50, 0.50, 0.50);

  let logoWidth = 0;
  let logoHeight = 0;

  try {
    const logoPath = path.join(__dirname, '..', 'assets', 'LogoCamara.png');
    const logoBytes = fs.readFileSync(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoDims = logoImage.scale(0.28);
    logoWidth = logoDims.width;
    logoHeight = logoDims.height;
    const logoX = (width - logoWidth) / 2;
    page.drawImage(logoImage, {
      x: logoX,
      y: 700,
      width: logoWidth,
      height: logoHeight,
    });
  } catch (_) {
    // logo not available, skip
  }

  const titleY = logoHeight > 0 ? 700 - logoHeight * 0.4 : 670;

  page.drawText('Cámara Comercial e Industrial de Bolívar', {
    x: (width - helveticaBold.widthOfTextAtSize('Cámara Comercial e Industrial de Bolívar', 16)) / 2,
    y: titleY,
    size: 16,
    font: helveticaBold,
    color: primaryColor,
  });

  page.drawText('Comprobante de Movimiento', {
    x: (width - helveticaBold.widthOfTextAtSize('Comprobante de Movimiento', 13)) / 2,
    y: titleY - 20,
    size: 13,
    font: helveticaBold,
    color: accentColor,
  });

  const lineY = titleY - 30;
  page.drawLine({
    start: { x: 50, y: lineY },
    end: { x: width - 50, y: lineY },
    thickness: 1.5,
    color: primaryColor,
  });

  let y = lineY - 14;

  const sectionTitle = (text: string, yPos: number) => {
    page.drawRectangle({
      x: 50,
      y: yPos - 4,
      width: width - 100,
      height: 20,
      color: lightGray,
    });
    page.drawText(text, {
      x: 58,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    return yPos - 24;
  };

  const fieldRow = (label: string, value: string, yPos: number, isBold = false) => {
    page.drawText(label, {
      x: 60,
      y: yPos,
      size: 10,
      font: helvetica,
      color: mediumGray,
    });
    page.drawText(value, {
      x: 200,
      y: yPos,
      size: 10,
      font: isBold ? helveticaBold : helvetica,
      color: darkText,
    });
    return yPos - 16;
  };

  const divider = (yPos: number) => {
    page.drawLine({
      start: { x: 50, y: yPos + 4 },
      end: { x: width - 50, y: yPos + 4 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
    return yPos - 6;
  };

  y = sectionTitle('INFORMACIÓN GENERAL', y);
  y = fieldRow('Fecha:', formatDate(data.fecha), y);
  y = fieldRow('Estado:', data.estado || '—', y, true);
  y = divider(y);

  y = sectionTitle('DATOS DEL COMPROBANTE', y);
  y = fieldRow('Tipo:', data.documento || '—', y);
  y = fieldRow('Comprobante:', data.comprobante || '—', y);
  y = fieldRow('Detalle:', data.detalle || '—', y);
  y = fieldRow('Tipo de movimiento:', data.tipo || '—', y);
  y = fieldRow('Estado:', data.movimiento || '—', y);
  y = divider(y);

  y = sectionTitle('IMPORTES', y);

  page.drawText('Importe:', {
    x: 60,
    y: y,
    size: 12,
    font: helvetica,
    color: mediumGray,
  });
  page.drawText(money(data.importe || 0), {
    x: 200,
    y: y,
    size: 14,
    font: helveticaBold,
    color: accentColor,
  });
  y -= 24;

  page.drawText('Saldo:', {
    x: 60,
    y: y,
    size: 12,
    font: helvetica,
    color: mediumGray,
  });
  page.drawText(money(data.saldo || 0), {
    x: 200,
    y: y,
    size: 14,
    font: helveticaBold,
    color: darkText,
  });
  y -= 24;
  y = divider(y);

  if (data.socioNombre || data.socioId) {
    y = sectionTitle('SOCIO', y);
    if (data.socioNombre) {
      y = fieldRow('Nombre:', data.socioNombre, y);
    }
    if (data.socioId) {
      y = fieldRow('ID Socio:', String(data.socioId), y);
    }
    y = divider(y);
  }

  y -= 20;

  page.drawLine({
    start: { x: 50, y: y + 10 },
    end: { x: width - 50, y: y + 10 },
    thickness: 1,
    color: primaryColor,
  });

  page.drawText('Documento generado automáticamente por SocCam', {
    x: (width - helveticaOblique.widthOfTextAtSize('Documento generado automáticamente por SocCam', 8)) / 2,
    y: y - 8,
    size: 8,
    font: helveticaOblique,
    color: mediumGray,
  });

  page.drawText(`Fecha de emisión: ${new Date().toLocaleString('es-AR')}`, {
    x: (width - helveticaOblique.widthOfTextAtSize(`Fecha de emisión: ${new Date().toLocaleString('es-AR')}`, 8)) / 2,
    y: y - 22,
    size: 8,
    font: helveticaOblique,
    color: mediumGray,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
