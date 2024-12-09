import { Router } from 'express';
import NotificacionController from '../controllers/notificacion.controller';

const router = Router();

router.post('/', NotificacionController.createNotificacion);
router.get('/socio/:socioId', NotificacionController.getNotificacionesBySocio);
router.delete('/:id', NotificacionController.deleteNotificacion);

export default router;
