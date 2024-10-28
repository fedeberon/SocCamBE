// src/routes/acontecimiento.routes.ts
import { Router } from 'express';
import AcontecimientoController from '../controllers/acontecimiento.controller';
import { checkJwt } from '../middleware/authMiddleware';

const acontecimientoRoutes = Router();

acontecimientoRoutes.get('/', AcontecimientoController.getAcontecimientos);
acontecimientoRoutes.get('/:id', checkJwt, AcontecimientoController.getAcontecimientoById);
acontecimientoRoutes.get('/socio/:id', checkJwt, AcontecimientoController.getAcontecimientosBySocio);



export default acontecimientoRoutes;    