require('dotenv').config();
import express from 'express';
import sequelize from './configs/database';
import userRouter from './router/user.routes';
import authRouter from './router/auth.routes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to  application.' });
});

app.use('/user', userRouter);
app.use('/auth', authRouter);

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
