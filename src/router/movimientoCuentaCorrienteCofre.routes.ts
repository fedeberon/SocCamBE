import { Router } from 'express';
import MovimientoCuentaCorrienteCofreController from '../controllers/movimientoCuentaCorrienteCofre.controller';
import { checkJwt } from '../middleware/authMiddleware';

const movimientoRoutes = Router();

movimientoRoutes.get('/', checkJwt, MovimientoCuentaCorrienteCofreController.getMovimientos);
movimientoRoutes.get('/:id', checkJwt, MovimientoCuentaCorrienteCofreController.getMovimientoById);
movimientoRoutes.get('/cliente/:clienteId', checkJwt, MovimientoCuentaCorrienteCofreController.getMovimientosByClienteId);
movimientoRoutes.get('/fecha/:fecha', checkJwt, MovimientoCuentaCorrienteCofreController.getMovimientosByFecha);
movimientoRoutes.get('/con-pagos/:clienteId', checkJwt, MovimientoCuentaCorrienteCofreController.getMovimientoWithPagos);

export default movimientoRoutes;