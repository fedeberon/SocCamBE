import { Router } from 'express';
import UserController from '../controllers/user.controller';
import authMiddleware from '../middleware/authMiddleware';

const userRouter = Router();

userRouter.get('/', authMiddleware, UserController.get);
userRouter.get('/:id', authMiddleware, UserController.getById);
userRouter.post('/', authMiddleware, UserController.create);
userRouter.put('/:id', authMiddleware, UserController.update);
userRouter.delete('/:id', authMiddleware, UserController.delete);

export default userRouter;
