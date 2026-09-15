import { Router } from 'express';
import CategoriaController from '../controllers/categoria.controller';

const router = Router();

// Ojo con el orden: /socio/:socioId debe ir antes de /:id para no colisionar.
router.get('/socio/:socioId', CategoriaController.listarPorSocio);

router.get('/', CategoriaController.listar);
router.post('/', CategoriaController.crear);
router.get('/:id/socios', CategoriaController.listarSocios);
router.post('/:id/socios', CategoriaController.asignarSocio);
router.delete('/:id/socios/:socioId', CategoriaController.quitarSocio);
router.get('/:id/servicios', CategoriaController.listarServicios);
router.post('/:id/asignar-servicios', CategoriaController.asignarServicios);
router.get('/:id', CategoriaController.obtener);
router.put('/:id', CategoriaController.actualizar);
router.delete('/:id', CategoriaController.eliminar);

export default router;
