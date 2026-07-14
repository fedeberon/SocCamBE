import { Router } from 'express';
import CajaSeguridadController from '../controllers/cajaSeguridad.controller';

const router = Router();

// Tamaños
router.get('/tamanos', CajaSeguridadController.getTamanos);
router.post('/tamanos', CajaSeguridadController.createTamano);
router.put('/tamanos/:id', CajaSeguridadController.updateTamano);

// Cajas
router.get('/', CajaSeguridadController.getCajas);
router.post('/', CajaSeguridadController.createCaja);
router.put('/:id', CajaSeguridadController.updateCaja);
router.delete('/:id', CajaSeguridadController.deleteCaja);

// Endpoints por socio/caja (específicos)
router.get('/cofres/vencidos', CajaSeguridadController.getCofresVencidos);
router.get('/cofres/socio/:socioId', CajaSeguridadController.getCofresBySocioMirror);
router.get('/socio/:socioId', CajaSeguridadController.getCajasBySocio);
router.get('/:cajaId/socios', CajaSeguridadController.getSociosByCaja);

// Asignaciones socio-caja
router.post('/asignar', CajaSeguridadController.assignSocioACaja);
router.delete('/asignar/:socioId/:cajaId', CajaSeguridadController.unassignSocioDeCaja);
router.delete('/asignar', CajaSeguridadController.unassignSocioDeCaja);

// Sincronización de flags
router.post('/sync-tiene-caja', CajaSeguridadController.syncTieneCajaSeguridad);

// Debe quedar al final para no tapar rutas específicas
router.get('/:id', CajaSeguridadController.getCajaById);

export default router;
