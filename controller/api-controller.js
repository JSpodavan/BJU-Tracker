import pool from '../db.js';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
class apiController {
    async search(req, res) {
        const { product } = req.body;
        try {
            const token = req.cookies.auth_token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const poolResponse = await pool.query(
                'SELECT * FROM products WHERE name=$1',
                [product]
            );
            const poolResponse3 = await pool.query(
                'SELECT * FROM history WHERE user_id=$1 AND product_id=$2',
                [decoded.id, poolResponse.rows[0].id]
            );
            if (poolResponse3.rows.length != 0) {
                return res.json({ alreadyExsist: true });
            }
            if (poolResponse.rows.length != 0) {
                const poolResponse2 = await pool.query(
                    'INSERT INTO history (user_id, product_id) VALUES ($1, $2)',
                    [parseInt(decoded.id), poolResponse.rows[0].id]
                );
                return res.json(poolResponse.rows[0]);
            }
        } catch (error) {
            console.log(error + '1');
        }
        try {
            const response = await fetch(
                `https://api.edamam.com/api/food-database/v2/parser?app_id=${
                    process.env.EDAMAM_ID
                }&app_key=${process.env.EDAMAM_KEY}&ingr=${encodeURIComponent(
                    product
                )}`,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );
            const data = await response.json();
            const response1 = await fetch(
                `https://world.openfoodfacts.org/api/v2/search?categories_tags=${product}&fields=categories_tags&page_size=1`
            );
            let categories = await response1.json();
            if (categories.products.length == 0) {
                return res.json({ exsists: false });
            } else {
                categories = categories.products[0].categories_tags;
            }
            let category = '';
            for (let item of categories) {
                if (item.includes('fruits')) {
                    category = 'Фрукты';
                    break;
                }
                if (item.includes('vegetables')) {
                    category = 'Овощи';
                    break;
                }
                if (item.includes('snacks')) {
                    category = 'Снеки';
                    break;
                }
                if (item.includes('meats')) {
                    category = 'Мясо';
                    break;
                }
                if (item.includes('nuts')) {
                    category = 'Орехи';
                    break;
                }
                if (item.includes('seafood')) {
                    category = 'Морепродукты';
                    break;
                }
                if (item.includes('plant-based-foods')) {
                    category = 'Растительная пища';
                    break;
                }
            }
            const calories = Math.floor(
                data.hints[0].food.nutrients.ENERC_KCAL
            );
            const protein = Math.floor(data.hints[0].food.nutrients.PROCNT);
            const fat = Math.floor(data.hints[0].food.nutrients.FAT);
            const carbs = Math.floor(data.hints[0].food.nutrients.CHOCDF);
            const values = {
                name: product,
                category: category,
                calories: calories,
                protein: protein,
                fat: fat,
                carbs: carbs,
            };
            const poolResponse1 = await pool.query(
                'INSERT INTO products (name, category, calories, protein, fat, carbs) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [product, category, calories, protein, fat, carbs]
            );
            const token = req.cookies.auth_token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const poolResponse3 = await pool.query(
                'INSERT INTO history (user_id, product_id) VALUES ($1, $2)',
                [parseInt(decoded.id), poolResponse1.rows[0].id]
            );
            res.json(values);
        } catch (error) {
            console.log(error + '2');
        }
    }
    async loadHistory(req, res) {
        try {
            const token = req.cookies.auth_token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const poolResponse = await pool.query(
                'SELECT * FROM history WHERE user_id=$1',
                [decoded.id]
            );
            let productsIds = [];
            let cnt = 0;
            for (let i = poolResponse.rows.length - 1; i != 0; i--) {
                productsIds.push(poolResponse.rows[i].product_id);
                cnt++;
                if (cnt == 6) break;
            }
            const poolResponse2 = await pool.query(
                'SELECT * FROM products WHERE id=ANY($1)',
                [productsIds]
            );
            res.json(poolResponse2.rows);
        } catch (error) {
            console.log(error);
        }
    }
    async addFavourite(req, res) {
        try {
            const { name } = req.body;
            const token = req.cookies.auth_token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const poolResponse = await pool.query(
                'SELECT id FROM products WHERE name=$1',
                [name]
            );
            const poolResponse2 = await pool.query(
                'SELECT * FROM favourite WHERE user_id=$1 AND product_id=$2',
                [decoded.id, parseInt(poolResponse.rows[0].id)]
            );
            if (poolResponse2.rows.length == 0) {
                const poolResponse1 = await pool.query(
                    'INSERT INTO favourite(user_id, product_id) VALUES($1, $2)',
                    [decoded.id, parseInt(poolResponse.rows[0].id)]
                );
                res.json({ answer: `${name} добавлен в избранное` });
            } else {
                res.json({ answer: `${name} уже добавлен в избранное` });
            }
        } catch (error) {
            res.json({ answer: 'Произошла ошибка' });
            console.log(error);
        }
    }
    async loadFavourite(req, res) {
        try {
            const token = req.cookies.auth_token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const poolResponse = await pool.query(
                'SELECT product_id FROM favourite WHERE user_id=$1',
                [decoded.id]
            );
            let product_ids = [];
            for (let i = 0; i < poolResponse.rows.length; i++) {
                product_ids.push(poolResponse.rows[i].product_id);
            }
            const poolResponse2 = await pool.query(
                'SELECT * FROM products WHERE id =ANY($1)',
                [product_ids]
            );
            res.json(poolResponse2.rows);
        } catch (error) {
            console.log(error);
        }
    }
    async deleteFavourite(req, res) {
        try {
            const { name } = req.body;
            const token = req.cookies.auth_token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const poolResponse1 = await pool.query(
                'SELECT id FROM products WHERE name=$1',
                [name]
            );
            const poolResponse = await pool.query(
                'DELETE FROM favourite WHERE user_id=$1 AND product_id=$2',
                [decoded.id, poolResponse1.rows[0].id]
            );
            res.json({ answer: `Вы удалили продукт : ${name}` });
        } catch (error) {
            console.log(error);
            res.json({ answer: 'Произошла ошибка' });
        }
    }
}

export default new apiController();
