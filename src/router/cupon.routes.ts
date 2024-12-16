import { Router } from 'express';
import CuponController from '../controllers/cupon.controller';

const router = Router();

router.post('/', CuponController.createCupon);
router.get('/', CuponController.getCupones);
router.get('/socio/:socioId', CuponController.getCuponesBySocio);
router.put('/mark-as-used/:id', CuponController.markAsUsed);
router.delete('/:id', CuponController.deleteCupon);
router.post('/asignar', CuponController.assignCupon);

export default router;
