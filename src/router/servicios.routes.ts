import { Router } from 'express';
import ServiciosController from '../controllers/servicios.controller';

const router = Router();

router.get('/', ServiciosController.listar);
router.post('/asociaciones', ServiciosController.crearAsociacion);

export default router;
