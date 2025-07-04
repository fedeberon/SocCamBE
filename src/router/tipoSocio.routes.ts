import { Router } from 'express';
import TipoSocioController from '../controllers/tipoSocio.controller';

const tipoSocioRoutes = Router();

tipoSocioRoutes.get('/', TipoSocioController.getTipoSocios);
tipoSocioRoutes.get('/:id', TipoSocioController.getTipoSocioById);
tipoSocioRoutes.post('/', TipoSocioController.createTipoSocio);
tipoSocioRoutes.put('/:id', TipoSocioController.updateTipoSocio);
tipoSocioRoutes.delete('/:id', TipoSocioController.deleteTipoSocio);

export default tipoSocioRoutes;


