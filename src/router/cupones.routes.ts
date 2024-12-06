import { Router } from 'express';
import * as CuponesController from '../controllers/cupones.controller';
import { checkJwt } from '../middleware/authMiddleware';

const cuponesRoutes = Router();

cuponesRoutes.get('/', checkJwt, CuponesController.getAllCupones);
cuponesRoutes.get('/:id', checkJwt, CuponesController.getCuponById);
cuponesRoutes.post('/', checkJwt, CuponesController.createCupon);
cuponesRoutes.put('/:id', checkJwt, CuponesController.updateCupon);
cuponesRoutes.post('/:cuponId/assign', checkJwt, CuponesController.assignCuponToSocios);

export default cuponesRoutes;
