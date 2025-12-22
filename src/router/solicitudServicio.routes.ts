import { Router } from 'express';
import SolicitudServicioController from '../controllers/solicitudServicio.controller';

const router = Router();

router.post('/', SolicitudServicioController.crear);

export default router;
