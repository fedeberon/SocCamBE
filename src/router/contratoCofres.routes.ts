import { Router } from 'express';
import ContratoCofresController from '../controllers/contratoCofres.controller';
import { checkJwt } from '../middleware/authMiddleware';

const contratoCofresRoutes = Router();

contratoCofresRoutes.get('/', checkJwt, ContratoCofresController.getContratoCofres);
contratoCofresRoutes.get('/:id', checkJwt, ContratoCofresController.getContratoCofresById);
contratoCofresRoutes.get('/socio/:socioId', checkJwt, ContratoCofresController.getContratoCofressBySocioId);

export default contratoCofresRoutes;