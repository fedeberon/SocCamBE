import { Router } from 'express';
import { getAllPagosCofres, getPagosCofresById, getPagosCofresByContrato } from '../controllers/pagosCofres.controller';
import { checkJwt } from '../middleware/authMiddleware';

const pagosCofresRoutes = Router();

pagosCofresRoutes.get('/', checkJwt, getAllPagosCofres);
pagosCofresRoutes.get('/:id', checkJwt, getPagosCofresById);
pagosCofresRoutes.get('/contrato/:contratoId', checkJwt, getPagosCofresByContrato);

export default pagosCofresRoutes;