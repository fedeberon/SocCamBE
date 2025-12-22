import { Router } from 'express';
import MercadoPagoController from '../controllers/mercadoPago.controller';

const router = Router();

router.post('/preferencias', MercadoPagoController.crearPreferencia);
router.post('/webhook', MercadoPagoController.webhook);
router.post('/procesar-pago', MercadoPagoController.procesarPago);

export default router;
