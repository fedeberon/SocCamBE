import { Router } from 'express';
import UserController from '../controllers/user.controller';
import {checkJwt} from '../middleware/authMiddleware';


const userRouter = Router();

userRouter.get('/',checkJwt , UserController.get);
userRouter.get('/:id',checkJwt, UserController.getById);
userRouter.post('/',checkJwt, UserController.create);
userRouter.put('/:id',checkJwt, UserController.update);
userRouter.delete('/:id',checkJwt, UserController.delete);

export default userRouter;
