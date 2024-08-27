import { Router } from 'express';
import UserController from '../controllers/user.controller';


let userRouter = Router();

userRouter.get('/',UserController.get)
userRouter.get('/:id',UserController.getById)
userRouter.post('/', UserController.create)
userRouter.put('/:id',UserController.update)
userRouter.delete('/:id',UserController.delete)

export default userRouter;