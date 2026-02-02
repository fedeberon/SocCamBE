import { Router } from 'express';
import ServiciosController from '../controllers/servicios.controller';

const router = Router();

router.get('/', ServiciosController.listar);
router.post('/', ServiciosController.crear);
router.put('/:servicioId', ServiciosController.actualizar);
router.delete('/:servicioId', ServiciosController.bajaLogica);
router.post('/asociaciones', ServiciosController.crearAsociacion);
router.get('/asociaciones/socio/:socioId', ServiciosController.listarAsociacionesPorSocio);
router.delete('/asociaciones/:socioId/:servicioId', ServiciosController.eliminarAsociacion);

export default router;
