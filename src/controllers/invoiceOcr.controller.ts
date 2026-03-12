import { Request, Response } from 'express';
import invoiceOcrService from '../service/invoiceOcr.service';
import logger from '../configs/logger';

class InvoiceOcrController {
  static async scan(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file?.buffer) {
        return res.status(400).json({ message: 'image es requerido (multipart/form-data, field: image)' });
      }

      const socioId = Number((req.body || {}).socio_id || 0);
      logger.info('[invoiceOcr] request received', {
        socioId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      });

      const result = await invoiceOcrService.scanInvoiceImage(file.buffer, {
        socioId: Number.isFinite(socioId) ? socioId : 0,
        fileName: file.originalname || `factura-${Date.now()}.jpg`,
        contentType: file.mimetype || 'image/jpeg',
      });
      logger.info('[invoiceOcr] response ready', {
        socioId,
        status: (result as any)?.status,
        hasHolder: Boolean((result as any)?.invoice?.holderName),
        hasTotal: Boolean((result as any)?.invoice?.totalAmount),
        linesCount: (result as any)?.ocr?.linesCount || 0,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Error en OCR de factura', error);
      return res.status(500).json({
        status: 'error',
        message: error?.message || 'Error procesando factura con OCR',
      });
    }
  }
}

export default InvoiceOcrController;
