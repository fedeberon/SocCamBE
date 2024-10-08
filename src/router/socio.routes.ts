import { Router } from 'express';
import { getSocios, getSocioById, getSociosByEmail } from '../controllers/socio.controller';
import {checkJwt} from '../middleware/authMiddleware';

const socioRoutes  = Router();

socioRoutes .get('/',checkJwt, getSocios);
socioRoutes .get('/:id',checkJwt, getSocioById);
socioRoutes.get('/email/:email', checkJwt, getSociosByEmail);


export default socioRoutes;