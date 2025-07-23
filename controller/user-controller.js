import pool from '../db.js';
class UserController {
    async createUser(req, res) {
        const { name, email, password } = req.body;
        const newPerson = await pool.query(
            'INSERT INTO users(name, email, password) VALUES ($1, $2, $3) RETURNING *',
            [name, email, password]
        );
        res.json(newPerson.rows[0]);
    }
    async login(req, res) {
        const { email, password } = req.body;
        const person = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND password = $2',
            [email, password]
        );
        if (person.rows.length != 0) {
            res.json({
                status: 'ok',
                name: person.rows[0].name,
                email: person.rows[0].email,
                password: person.rows[0].password,
            });
        }
    }
}
export default new UserController();
