import pool from '../db.js';
import bcrypt from 'bcryptjs';
import { urlencoded } from 'express';
import jwt from 'jsonwebtoken';
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
            'INSERT INTO users(name, email, password) VALUES ($1, $2, $3) RETURNING *',
            [name, email, hashPassword]
        );
        const token = jwt.sign(
            { name: name, email: email },
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
                { name: user.name, email: user.email },
                process.env.JWT_SECRET
            );
            console.log('Токен :', token);
            res.cookie('auth_token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'Lax',
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            res.status(200).json({ name: user.name, email: user.email });
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
}
export default new UserController();
