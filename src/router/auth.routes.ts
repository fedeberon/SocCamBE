import { Router } from 'express';
import UserController from '../controllers/user.controller';

const authRouter = Router();

authRouter.post('/login', UserController.login);
authRouter.post('/register', UserController.register);

export default authRouter;
