import { Router } from 'express';
import CampaniasController from '../controllers/campanias.controller';

const router = Router();

router.get('/', CampaniasController.listar);
router.get('/:campaniaId', CampaniasController.obtenerPorId);
router.post('/', CampaniasController.crear);
router.put('/:campaniaId', CampaniasController.actualizar);
router.delete('/:campaniaId', CampaniasController.eliminar);

router.post('/asociar', CampaniasController.asociarSocio);
router.post('/asociar-bulk', CampaniasController.asociarSociosBulk);
router.post('/aceptar/:socioCampaniaId', CampaniasController.aceptarCampania);
router.post('/rechazar/:socioCampaniaId', CampaniasController.rechazarCampania);
router.get('/socio/:socioId', CampaniasController.listarPorSocio);
router.get('/:campaniaId/socios', CampaniasController.listarSociosPorCampania);
router.delete('/asociacion/:socioCampaniaId', CampaniasController.eliminarAsociacion);

export default router;
