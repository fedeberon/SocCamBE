import { Router } from 'express';
import { getAllPagosSocios, getDeudaBySocio, getPagosSociosById, getPagosSociosBySocio, getSociosSosByCuit } from '../controllers/pagosSocios.controller';
import { checkJwt } from '../middleware/authMiddleware';

const pagosSociosRoutes = Router();

pagosSociosRoutes.get('/', checkJwt, getAllPagosSocios);
pagosSociosRoutes.get('/sos/socios/:cuit', checkJwt, getSociosSosByCuit);
pagosSociosRoutes.get('/:id', checkJwt, getPagosSociosById);
pagosSociosRoutes.get('/socio/:socioId', checkJwt, getPagosSociosBySocio);
// Alias legacy (plural) para compatibilidad con clientes viejos
pagosSociosRoutes.get('/socios/:socioId', checkJwt, getPagosSociosBySocio);
pagosSociosRoutes.get('/deuda_socio/:socioId', checkJwt, getDeudaBySocio);

export default pagosSociosRoutes;
