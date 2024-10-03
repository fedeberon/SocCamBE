require('dotenv').config();
import express from 'express';
import sequelize from './configs/database';
import userRouter from './router/user.routes';
import authRouter from './router/auth.routes';
import {checkJwt,handleAuthErrors} from './middleware/authMiddleware';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
let corsOptions = {
  origin: 'http://localhost:3000',
}
app.use(cors(corsOptions))

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to  application.' });
});

app.use(checkJwt)
app.use(handleAuthErrors)
app.use('/user', userRouter);
app.use('/auth', authRouter);


sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
