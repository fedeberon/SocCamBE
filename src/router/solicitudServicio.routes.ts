import { Router } from 'express';
import SolicitudServicioController from '../controllers/solicitudServicio.controller';

const router = Router();

router.post('/', SolicitudServicioController.crear);
router.get('/', SolicitudServicioController.listar);
router.patch('/:solicitudId/aprobar', SolicitudServicioController.aprobar);

export default router;
