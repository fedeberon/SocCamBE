import { Router } from 'express';
import MovimientoCuentaCorrienteCofreController from '../controllers/movimientoCuentaCorrienteCofre.controller';
import { checkJwt } from '../middleware/authMiddleware';

const movimientoRoutes = Router();

movimientoRoutes.get('/', checkJwt, MovimientoCuentaCorrienteCofreController.getMovimientos);
movimientoRoutes.get('/cliente/:clienteId', checkJwt, MovimientoCuentaCorrienteCofreController.getMovimientosByClienteId);
movimientoRoutes.get('/fecha/:fecha', checkJwt, MovimientoCuentaCorrienteCofreController.getMovimientosByFecha);
movimientoRoutes.get('/con-pagos/:clienteId', checkJwt, MovimientoCuentaCorrienteCofreController.getMovimientoWithPagos);
movimientoRoutes.get('/cofres/socio/:socioId', checkJwt, MovimientoCuentaCorrienteCofreController.getResumenBySocioId);
movimientoRoutes.post('/factura-pdf', checkJwt, MovimientoCuentaCorrienteCofreController.generarFacturaPdf);
movimientoRoutes.get('/:id', checkJwt, MovimientoCuentaCorrienteCofreController.getMovimientoById);

export default movimientoRoutes;