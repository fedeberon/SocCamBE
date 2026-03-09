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

      const result = await invoiceOcrService.scanInvoiceImage(file.buffer);
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
