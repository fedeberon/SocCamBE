import { Router } from 'express';
import { getSocios, getSocioById, getSociosByEmail, getSociosByMatricula, getSocioWithPagos} from '../controllers/socio.controller';
import {checkJwt} from '../middleware/authMiddleware';

const socioRoutes  = Router();

socioRoutes .get('/',checkJwt, getSocios);
socioRoutes .get('/:id',checkJwt, getSocioById);
socioRoutes.get('/email/:email', checkJwt, getSociosByEmail);
socioRoutes.get('/matricula/:matricula', checkJwt, getSociosByMatricula);
socioRoutes.get('/:id/pagos', checkJwt, getSocioWithPagos);


export default socioRoutes;