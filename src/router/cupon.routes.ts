import { Router } from 'express';
import CuponController from '../controllers/cupon.controller';

const router = Router();

router.post('/', CuponController.createCupon);
router.get('/', CuponController.getCupones);
router.get('/socios', CuponController.getCuponesConSocios);
router.get('/socio/:socioId', CuponController.getCuponesBySocio);
router.get('/usados', CuponController.getCuponesUsados);
router.put('/mark-as-used/:id', CuponController.markAsUsed);
router.delete('/:id', CuponController.deleteCupon);
router.post('/asignar', CuponController.assignCupon);
router.post('/desasignar', CuponController.unassignCupon);
router.post('/usar', CuponController.usarCupon);
router.post('/canjear-descuento', CuponController.canjearPorDescuento);

export default router;
