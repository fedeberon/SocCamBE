// src/routes/acontecimiento.routes.ts
import { Router } from 'express';
import AcontecimientoController from '../controllers/acontecimiento.controller';
import { checkJwt } from '../middleware/authMiddleware';

const acontecimientoRoutes = Router();

acontecimientoRoutes.get('/', checkJwt, AcontecimientoController.getAcontecimientos);
acontecimientoRoutes.get('/ubicaciones', AcontecimientoController.listarUbicaciones);
acontecimientoRoutes.get('/categorias', AcontecimientoController.listarCategorias);
acontecimientoRoutes.get('/socio/:socioId', checkJwt, AcontecimientoController.getAcontecimientosBySocio);

acontecimientoRoutes.post('/', checkJwt, AcontecimientoController.crear);
acontecimientoRoutes.put('/:id', checkJwt, AcontecimientoController.actualizar);
acontecimientoRoutes.delete('/:id', checkJwt, AcontecimientoController.eliminar);

acontecimientoRoutes.get('/:id/socios', checkJwt, AcontecimientoController.listarSocios);
acontecimientoRoutes.post('/:id/socios', checkJwt, AcontecimientoController.asignarSocios);
acontecimientoRoutes.delete('/:id/socios/:socioId', checkJwt, AcontecimientoController.desasignarSocio);

acontecimientoRoutes.get('/:id', checkJwt, AcontecimientoController.getAcontecimientoById);

export default acontecimientoRoutes;
