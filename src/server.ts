require('dotenv').config();
import express from 'express';
import { Request, Response, NextFunction }  from 'express';
import sequelize from './configs/database';
import userRouter from './router/user.routes';
import authRouter from './router/auth.routes';
import socioRoutes from './router/socio.routes';
import pagosSociosRoutes from './router/pagosSocios.routes';
import movimientoRoutes from './router/movimientoCuentaCorrienteCofre.routes';
import acontecimientoRoutes from './router/acontecimiento.routes';
import contratoCofresRoutes from './router/contratoCofres.routes';

import notificacionRoutes from './router/notificacion.routes';
import dashboardRoutes from './router/dashboard.routes';
import solicitudServicioRoutes from './router/solicitudServicio.routes';
import serviciosRoutes from './router/servicios.routes';
import mercadoPagoRoutes from './router/mercadoPago.routes';
import MercadoPagoController from './controllers/mercadoPago.controller';

import {checkJwt} from './middleware/authMiddleware';
import cors from 'cors';
import cuponesRoutes from './router/cupon.routes';
import cajaSeguridadRoutes from './router/cajaSeguridad.routes';
import filesRoutes from './router/files.routes';
import puntosRoutes from './router/puntos.routes';
import marketplaceRoutes from './router/marketplace.routes';


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to  application.' });
});

app.use('/user', userRouter);
app.use('/auth', authRouter);
app.use('/socio', socioRoutes);
app.use('/pagos-socios', pagosSociosRoutes);
app.use('/movimientos', movimientoRoutes);
app.use('/acontecimientos', acontecimientoRoutes);
app.use('/contrato-cofres', contratoCofresRoutes);
app.use('/cupones', cuponesRoutes);
app.use('/cajas', cajaSeguridadRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/solicitudes-servicio', solicitudServicioRoutes);
app.use('/servicios', serviciosRoutes);
app.use('/mercadopago', mercadoPagoRoutes);
app.use('/files', filesRoutes);
app.use('/puntos', puntosRoutes);
app.use('/market', marketplaceRoutes);
// Webhook directo (para usar en MP_NOTIFICATION_URL)
app.post('/webhook/mercadopago', MercadoPagoController.webhook);
// Retorno success/failure desde back_urls de MP
app.get('/mercadopago/success', MercadoPagoController.retorno);
app.get('/mercadopago/failure', MercadoPagoController.retorno);

app.use('/notificaciones', notificacionRoutes);


app.get('/authorized', (req, res) => {
  res.json({ message: 'seguro' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500).json({
    status: err.status || 500,
    error: err.message || 'Internal Server Error',
  });
});
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
