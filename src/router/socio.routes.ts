import { Router } from 'express';
import SocioController from '../controllers/socio.controller';

const socioRoutes  = Router();

socioRoutes.get('/', SocioController.getSocios);
socioRoutes.get('/search', SocioController.searchSociosByName);
socioRoutes.post('/:id/sync-sos', SocioController.enqueueSosSync);
socioRoutes .get('/:id', SocioController.getSocioById);
socioRoutes.get('/email/:email',  SocioController.getSociosByEmail);
socioRoutes.get('/matricula/:matricula',  SocioController.getSociosByMatricula);
socioRoutes.get('/:id/pagos',  SocioController.getSocioWithPagos);
socioRoutes.get('/:id/movimientos-cofre',  SocioController.getSocioMovimientosCofre);
socioRoutes.get('/:id/cajas', SocioController.getCajasSeguridadBySocio);
socioRoutes.get('/:id/puntos', SocioController.getPuntosBySocio);
socioRoutes.post('/:id/puntos', SocioController.addPuntosBySocio);
socioRoutes.post('/',  SocioController.createSocio);
socioRoutes.put('/:id',  SocioController.updateSocio);
socioRoutes.delete('/:id', SocioController.deleteSocio);

export default socioRoutes;
