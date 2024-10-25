import { Router } from 'express';
import SocioController from '../controllers/socio.controller';
import {checkJwt} from '../middleware/authMiddleware';

const socioRoutes  = Router();

socioRoutes.get('/',checkJwt, SocioController.getSocios);
socioRoutes .get('/:id',checkJwt, SocioController.getSocioById);
socioRoutes.get('/email/:email', checkJwt, SocioController.getSociosByEmail);
socioRoutes.get('/matricula/:matricula', checkJwt, SocioController.getSociosByMatricula);
socioRoutes.get('/:id/pagos', checkJwt, SocioController.getSocioWithPagos);


export default socioRoutes;