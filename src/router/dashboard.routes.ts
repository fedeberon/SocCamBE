import { Router } from 'express';
import DashboardController from '../controllers/dashboard.controller';

const router = Router();

router.get('/cajas/resumen', DashboardController.resumenCajas);
router.get('/cajas/ocupacion-por-tamano', DashboardController.ocupacionPorTamano);
router.get('/pagos/porcentaje-deuda', DashboardController.porcentajeDeuda);
router.get('/pagos/deuda-por-mes/:anio', DashboardController.deudaPorMes);
router.get('/pagos/pagos-vs-impagos/:anio', DashboardController.pagoVsImpagoPorMes);
router.get('/pagos/total-recaudado', DashboardController.totalRecaudado);
router.get('/socios/resumen', DashboardController.resumenSocios);
router.get('/socios/por-categoria', DashboardController.sociosPorCategoria);
router.get('/socio/:socioId/inicio-resumen', DashboardController.resumenInicioSocio);

// Alias cortos
router.get('/resumen', DashboardController.resumenCajas);
router.get('/ocupacion-por-tamano', DashboardController.ocupacionPorTamano);
router.get('/porcentaje-deuda', DashboardController.porcentajeDeuda);
router.get('/deuda-por-mes/:anio', DashboardController.deudaPorMes);
router.get('/pagos-vs-impagos/:anio', DashboardController.pagoVsImpagoPorMes);
router.get('/total-recaudado', DashboardController.totalRecaudado);
router.get('/socios-resumen', DashboardController.resumenSocios);
router.get('/socios-por-categoria', DashboardController.sociosPorCategoria);
router.get('/socio-inicio-resumen/:socioId', DashboardController.resumenInicioSocio);

export default router;
