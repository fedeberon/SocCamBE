import { Router } from 'express';
import { getSocios, getSocioById } from '../controllers/socio.controller';

const socioRoutes  = Router();

socioRoutes .get('/socios', getSocios);
socioRoutes .get('/socios/:id', getSocioById);


export default socioRoutes ;