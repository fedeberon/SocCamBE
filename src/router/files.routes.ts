import { Router } from 'express';
import FilesController from '../controllers/files.controller';
import upload from '../middleware/upload.middleware';
import { checkJwt } from '../middleware/authMiddleware';

const filesRoutes = Router();

filesRoutes.post('/upload', checkJwt, upload.single('file'), FilesController.subirArchivo);
filesRoutes.post('/socios/:socioId/logo', checkJwt, upload.single('file'), FilesController.subirLogoSocio);
filesRoutes.post('/comercios/:comercioId/logo', checkJwt, upload.single('file'), FilesController.subirLogoComercio);
filesRoutes.post('/productos/:productoId/imagen', checkJwt, upload.single('file'), FilesController.subirImagenProducto);

export default filesRoutes;
