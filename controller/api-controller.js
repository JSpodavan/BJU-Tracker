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
                'SELECT id FROM products WHERE name=$1',
                [product]
            );
            const poolResponse3 = await pool.query(
                'SELECT * FROM history WHERE user_id=$1 AND product_id=$2',
                [decoded.id, poolResponse.rows[0].id]
            );
            if (poolResponse3.rows.length != 0) {
                return res.json({ alredyExsist: true });
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
            categories = categories.products[0].categories_tags;
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
                    category = 'Растительнаяпища';
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
}

export default new apiController();
