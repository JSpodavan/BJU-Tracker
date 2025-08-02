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
        const newPerson = await pool.query(
            'INSERT INTO users(name, email, password) VALUES ($1, $2, $3) RETURNING id',
            [name, email, hashPassword]
        );
        const token = jwt.sign(
            { name: name, email: email, id: newPerson.rows[0].id },
            process.env.JWT_SECRET
        );
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({ success: true });
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
        const token = req.cookies.auth_token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenTime = new Date(Date.now() + 3600000);
        await pool.query(
            'UPDATE users SET reset_token=$1, reset_token_time=$2 WHERE id=$3',
            [resetToken, resetTokenTime, decoded.id]
        );

        const resetLink = `http://localhost:5000/resetPassword.html?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL,
            to: decoded.email,
            subject: 'Сброс пароля',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Сброс пароля</h2>
                    <p>Вы запросили сброс пароля для аккаунта ${decoded.email}.</p>
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
}
export default new UserController();
