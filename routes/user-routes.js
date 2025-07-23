import express from 'express';
import userController from '../controller/user-controller.js';
const Router = express.Router;
const userRouter = new Router();

userRouter.post('/user', userController.createUser);
userRouter.post('/user/login', userController.login);

export default userRouter;
