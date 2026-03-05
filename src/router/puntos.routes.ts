import { Router } from 'express';
import PuntosController from '../controllers/puntos.controller';

const router = Router();

router.get('/comercios', PuntosController.getComercios);
router.post('/comercios', PuntosController.createComercio);
router.put('/comercios/:id', PuntosController.updateComercio);
router.post('/scan', PuntosController.scanQr);

export default router;
