require('dotenv').config();
import express from 'express';
import sequelize from './configs/database';
import userRouter from './router/user.routes';
import authRouter from './router/auth.routes';
import socioRoutes from './router/socio.routes';
import pagosSociosRoutes from './router/pagosSocios.routes';
import {checkJwt} from './middleware/authMiddleware';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
}));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to  application.' });
});

app.use(checkJwt)
app.use('/user', userRouter);
app.use('/auth', authRouter);
app.use('/socio', socioRoutes);
app.use('/pagos-socios', pagosSociosRoutes);

app.get('/authorized', (req, res) => {
  res.json({ message: 'seguro' });
});

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
