import { Router } from 'express';
import { getMovimientos, getMovimientoById, getMovimientosByClienteId, getMovimientosByFecha, getMovimientoWithPagos} from '../controllers/movimientoCuentaCorrienteCofre.controller';
import { checkJwt } from '../middleware/authMiddleware';

const movimientoRoutes = Router();

movimientoRoutes.get('/', checkJwt, getMovimientos);
movimientoRoutes.get('/:id', checkJwt, getMovimientoById);
movimientoRoutes.get('/cliente/:clienteId', checkJwt, getMovimientosByClienteId);
movimientoRoutes.get('/fecha/:fecha', checkJwt, getMovimientosByFecha);
movimientoRoutes.get('/with-pagos/:clienteId', checkJwt, getMovimientoWithPagos);

export default movimientoRoutes;