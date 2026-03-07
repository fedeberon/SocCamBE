import { Router } from 'express';
import PuntosController from '../controllers/puntos.controller';

const router = Router();

router.get('/comercios', PuntosController.getComercios);
router.post('/comercios', PuntosController.createComercio);
router.put('/comercios/:id', PuntosController.updateComercio);
router.get('/comercios-resumen', PuntosController.getComerciosResumen);
router.get('/comercios/:comercioId/admins', PuntosController.listarAdminsComercio);
router.post('/comercios/admins', PuntosController.asociarAdminComercio);
router.delete('/comercios/:comercioId/admins/:socioId', PuntosController.desasociarAdminComercio);
router.post('/qr/generar', PuntosController.generarQr);
router.post('/preview', PuntosController.previewQr);
router.post('/scan', PuntosController.scanQr);

export default router;
