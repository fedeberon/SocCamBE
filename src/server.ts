require("dotenv").config();
import express from 'express';
import sequelize from './configs/database';
import userRouter from './router/auth.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to  application." });
});

// Rutas de Modulos
app.use('/user', userRouter);

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
