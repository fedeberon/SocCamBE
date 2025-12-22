import { Router } from 'express';
import CajaSeguridadController from '../controllers/cajaSeguridad.controller';

const router = Router();

// Tamaños
router.get('/tamanos', CajaSeguridadController.getTamanos);
router.post('/tamanos', CajaSeguridadController.createTamano);
router.put('/tamanos/:id', CajaSeguridadController.updateTamano);

// Cajas
router.get('/', CajaSeguridadController.getCajas);
router.get('/:id', CajaSeguridadController.getCajaById);
router.post('/', CajaSeguridadController.createCaja);
router.put('/:id', CajaSeguridadController.updateCaja);
router.delete('/:id', CajaSeguridadController.deleteCaja);

// Asignaciones socio-caja
router.get('/:cajaId/socios', CajaSeguridadController.getSociosByCaja);
router.get('/socio/:socioId', CajaSeguridadController.getCajasBySocio);
router.post('/asignar', CajaSeguridadController.assignSocioACaja);
router.delete('/asignar/:socioId/:cajaId', CajaSeguridadController.unassignSocioDeCaja);
router.delete('/asignar', CajaSeguridadController.unassignSocioDeCaja);

export default router;
