import { Router } from 'express';
import ContratoCofresController from '../controllers/contratoCofres.controller';
import { checkJwt } from '../middleware/authMiddleware';

const contratoCofresRoutes = Router();

contratoCofresRoutes.post('/', checkJwt, ContratoCofresController.createContratoCofre);
contratoCofresRoutes.get('/', checkJwt, ContratoCofresController.getContratoCofres);
contratoCofresRoutes.get('/socio/:socioId', checkJwt, ContratoCofresController.getContratoCofressBySocioId);
contratoCofresRoutes.get('/:id/pdf', checkJwt, ContratoCofresController.getContratoPdf);
contratoCofresRoutes.post('/:id/firmar', checkJwt, ContratoCofresController.firmarContratoCofre);
contratoCofresRoutes.get('/:id', checkJwt, ContratoCofresController.getContratoCofresById);

export default contratoCofresRoutes;
