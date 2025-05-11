import { Router } from 'express';
import { getAllPagosSocios, getDeudaBySocio, getPagosSociosById, getPagosSociosBySocio } from '../controllers/pagosSocios.controller';
import { checkJwt } from '../middleware/authMiddleware';

const pagosSociosRoutes = Router();

pagosSociosRoutes.get('/', checkJwt, getAllPagosSocios);
pagosSociosRoutes.get('/:id', checkJwt, getPagosSociosById);
pagosSociosRoutes.get('/socio/:socioId', checkJwt, getPagosSociosBySocio);
pagosSociosRoutes.get('/deuda_socio/:socioId', checkJwt, getDeudaBySocio);

export default pagosSociosRoutes;