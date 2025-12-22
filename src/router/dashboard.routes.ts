import { Router } from 'express';
import DashboardController from '../controllers/dashboard.controller';

const router = Router();

router.get('/cajas/resumen', DashboardController.resumenCajas);
router.get('/cajas/ocupacion-por-tamano', DashboardController.ocupacionPorTamano);
router.get('/pagos/porcentaje-deuda', DashboardController.porcentajeDeuda);
router.get('/pagos/deuda-por-mes/:anio', DashboardController.deudaPorMes);

// Alias cortos
router.get('/resumen', DashboardController.resumenCajas);
router.get('/ocupacion-por-tamano', DashboardController.ocupacionPorTamano);
router.get('/porcentaje-deuda', DashboardController.porcentajeDeuda);
router.get('/deuda-por-mes/:anio', DashboardController.deudaPorMes);

export default router;
