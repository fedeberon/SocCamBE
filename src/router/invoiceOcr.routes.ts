import { Router } from 'express';
import InvoiceOcrController from '../controllers/invoiceOcr.controller';
import upload from '../middleware/upload.middleware';

const router = Router();

router.post('/scan', upload.single('image'), InvoiceOcrController.scan);

export default router;
