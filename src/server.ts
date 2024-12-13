require('dotenv').config();
import express from 'express';
import { Request, Response, NextFunction }  from 'express';
import sequelize from './configs/database';
import userRouter from './router/user.routes';
import authRouter from './router/auth.routes';
import socioRoutes from './router/socio.routes';
import pagosSociosRoutes from './router/pagosSocios.routes';
import movimientoRoutes from './router/movimientoCuentaCorrienteCofre.routes';
import pagosCofresRoutes from './router/pagosCofres.routes';
import acontecimientoRoutes from './router/acontecimiento.routes';
import contratoCofresRoutes from './router/contratoCofres.routes';
import notificacionRoutes from './router/notificacion.routes';

import {checkJwt} from './middleware/authMiddleware';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to  application.' });
});

app.use(checkJwt)
app.use('/user', userRouter);
app.use('/auth', authRouter);
app.use('/socio', socioRoutes);
app.use('/pagos-socios', pagosSociosRoutes);
app.use('/movimientos', movimientoRoutes);
app.use('/pagos-cofres', pagosCofresRoutes);
app.use('/acontecimientos', acontecimientoRoutes);
app.use('/contrato-cofres', contratoCofresRoutes);
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
