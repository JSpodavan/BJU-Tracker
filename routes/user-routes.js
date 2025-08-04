import express from 'express';
import userController from '../controller/user-controller.js';
const Router = express.Router;
const userRouter = new Router();
import { check, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
userRouter.post(
    '/user',
    [
        check('name', 'Имя пользователя не может быть пустым').notEmpty(),
        check('password', 'Пароль должен быть больше 4 символов').isLength({
            min: 4,
        }),
        check('email', 'Вы должны заполнить поле email').notEmpty(),
        check('email', 'Неверный формат email').isEmail(),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    userController.createUser
);
userRouter.post(
    '/user/login',
    [
        check('email', 'Заполните поле email').notEmpty(),
        check('password', 'Поле пароль не может быть пустым').notEmpty(),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    userController.login
);
userRouter.get(
    '/user/auth',
    (req, res, next) => {
        const token = req.cookies.auth_token;
        if (!token) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            res.clearCookie('auth_token');
            res.status(401).json({ error: 'Недействительный токен' });
        }
    },
    userController.getProfile
);
userRouter.post('/user/logout', userController.deleteToken);
userRouter.post('/user/send-reset-email', userController.sendEmail);
userRouter.post('/user/switch-password', userController.switchPassword);
userRouter.get('/user/verify-email', userController.verify);
userRouter.post(
    '/user/resend-verification',
    userController.resend_verification
);

export default userRouter;
