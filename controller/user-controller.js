import pool from '../db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { urlencoded } from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'azdima45.azer@gmail.com',
        pass: process.env.EMAIL_PASS,
    },
});

class UserController {
    async createUser(req, res) {
        const { name, email, password } = req.body;
        const alreadyReg = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        if (alreadyReg.rows.length != 0) {
            return res.status(400).json({
                status: 'Ошибка ',
                message: 'Пользователь с такой почтой уже есть',
            });
        }
        const hashPassword = await bcrypt.hash(password, 7);
        const verification_token = crypto.randomBytes(32).toString('hex');
        const verificationTokenTime = new Date(Date.now() + 3600000);
        const newPerson = await pool.query(
            'INSERT INTO users(name, email, password, verification_token, verification_token_expires) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [
                name,
                email,
                hashPassword,
                verification_token,
                verificationTokenTime,
            ]
        );
        const verificationLink = `http://localhost:5000/user/verify-email?token=${verification_token}`;
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Подтверждение почты',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Подтверждение почты</h2>
                    <p>Вы зарегистрировались на почту${email}.</p>
                    <p style="margin: 20px 0;">
                        <a href="${verificationLink}" 
                           style="background-color: #3498db; 
                                  color: white; 
                                  padding: 10px 20px; 
                                  text-decoration: none; 
                                  border-radius: 5px;
                                  display: inline-block;">
                            Подтвердить почту
                        </a>
                    </p>
                    <p><small style="color: #7f8c8d;">Ссылка действительна в течение 1 дня.</small></p>
                    <p style="color: #7f8c8d;">
                        Если вы не регистрировались на нашем сайте, проигнорируйте это письмо.
                    </p>
                </div>
            `,
        };
        try {
            await transporter.sendMail(mailOptions);
            res.json({
                message: 'Письмо для подтверждения регистрации отправлено',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при отправке письма' });
        }
    }
    async login(req, res) {
        const { email, password } = req.body;
        const person = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        if (person.rows.length === 0) {
            return res.status(401).json({
                status: 'Ошибка',
                message: 'Пользователь не найден',
            });
        }
        if (!person.rows[0].email_verified) {
            return res.status(401).json({
                status: 'Ошибка',
                message: 'Почта не подтверждена',
            });
        }
        const user = person.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign(
                { name: user.name, email: user.email, id: user.id },
                process.env.JWT_SECRET
            );
            console.log('Токен :', token);
            res.cookie('auth_token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'Lax',
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            res.status(200).json({
                name: user.name,
                email: user.email,
                id: user.id,
            });
        } else {
            res.status(401).json({
                status: 'Ошибка',
                message: 'Неверный пароль',
            });
        }
    }
    async getProfile(req, res) {
        res.json({
            user: req.user,
        });
    }
    async deleteToken(req, res) {
        res.clearCookie('auth_token');
        return res.status(200).json({ success: true });
    }
    async sendEmail(req, res) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenTime = new Date(Date.now() + 3600000);
        let email = 0;
        if (req.body.email == undefined) {
            email = decoded.email;
            const token = req.cookies.auth_token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
        } else {
            email = req.body.email;
        }
        if (email == undefined) {
            await pool.query(
                'UPDATE users SET reset_token=$1, reset_token_time=$2 WHERE id=$3',
                [resetToken, resetTokenTime, decoded.id]
            );
        } else {
            await pool.query(
                'UPDATE users SET reset_token=$1, reset_token_time=$2 WHERE email=$3',
                [resetToken, resetTokenTime, email]
            );
        }

        const resetLink = `http://localhost:5000/resetPassword.html?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Сброс пароля',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Сброс пароля</h2>
                    <p>Вы запросили сброс пароля для аккаунта ${email}.</p>
                    <p style="margin: 20px 0;">
                        <a href="${resetLink}" 
                           style="background-color: #3498db; 
                                  color: white; 
                                  padding: 10px 20px; 
                                  text-decoration: none; 
                                  border-radius: 5px;
                                  display: inline-block;">
                            Сбросить пароль
                        </a>
                    </p>
                    <p><small style="color: #7f8c8d;">Ссылка действительна в течение 1 часа.</small></p>
                    <p style="color: #7f8c8d;">
                        Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
                    </p>
                </div>
            `,
        };
        try {
            await transporter.sendMail(mailOptions);
            res.json({
                message: 'Письмо с инструкциями отправлено на ваш email',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при отправке письма' });
        }
    }
    async switchPassword(req, res) {
        const { token, password } = req.body;
        const user = await pool.query(
            'SELECT * FROM users WHERE reset_token=$1',
            [token]
        );
        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (isMatch) {
            res.json({
                answer: 'Пароль совпадает с прошлым, придумайте другой',
            });
        } else {
            const hashPassword = await bcrypt.hash(password, 7);
            await pool.query(
                'UPDATE users SET password =$1, reset_token=NULL, reset_token_time=NULL WHERE email=$2',
                [hashPassword, user.rows[0].email]
            );
            res.json({ success: true });
        }
    }
    async verify(req, res) {
        const token = req.query.token;
        const user = await pool.query(
            'SELECT * FROM users WHERE verification_token=$1 AND verification_token_expires > NOW()',
            [token]
        );
        if (!user.rows.length) {
            const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ссылка устарела</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .container { max-width: 500px; margin: 0 auto; }
                    .btn { 
                        background-color: #4CAF50;
                        border: none;
                        color: white;
                        padding: 15px 32px;
                        text-align: center;
                        text-decoration: none;
                        display: inline-block;
                        font-size: 16px;
                        margin: 20px 0;
                        cursor: pointer;
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Ссылка для подтверждения устарела</h2>
                    <p>Нажмите кнопку ниже, чтобы отправить новое письмо с подтверждением</p>
                    <form action="/user/resend-verification" method="POST">
                        <input type="hidden" name="email" value="${
                            user.rows[0]?.email || ''
                        }">
                        <button type="submit" class="btn">Отправить письмо повторно</button>
                    </form>
                </div>
            </body>
            </html>
            `;
            return res.send(html);
        }
        await pool.query(
            'UPDATE users SET email_verified = true, verification_token=null, verification_token_expires=null WHERE id = $1',
            [user.rows[0].id]
        );
        const token1 = jwt.sign(
            {
                name: user.rows[0].name,
                email: user.rows[0].email,
                id: user.rows[0].id,
            },
            process.env.JWT_SECRET
        );
        res.cookie('auth_token', token1, {
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.send('Почта подтверждена!');
    }
    async resend_verification(req, res) {
        const { email } = req.body;
        const newToken = crypto.randomBytes(32).toString('hex');
        const resetTokenTime = new Date(Date.now() + 3600000);
        await pool.query(
            'UPDATE users SET verification_token=$1, verification_token_expires=$2 WHERE email=$3',
            [newToken, resetTokenTime, email]
        );
        const resetLink = `http://localhost:5000/resetPassword.html?token=${newToken}`;

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Сброс пароля',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Сброс пароля</h2>
                    <p>Вы запросили сброс пароля для аккаунта ${email}.</p>
                    <p style="margin: 20px 0;">
                        <a href="${resetLink}" 
                           style="background-color: #3498db; 
                                  color: white; 
                                  padding: 10px 20px; 
                                  text-decoration: none; 
                                  border-radius: 5px;
                                  display: inline-block;">
                            Сбросить пароль
                        </a>
                    </p>
                    <p><small style="color: #7f8c8d;">Ссылка действительна в течение 1 часа.</small></p>
                    <p style="color: #7f8c8d;">
                        Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
                    </p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        res.send('Письмо отправлено');
    }
}
export default new UserController();
