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
            res.json({
                products: poolResponse2.rows,
                products_ids: product_ids,
            });
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
    async createDish(req, res) {
        try {
            const { name, products, user_id } = req.body;
            const poolResponse = await pool.query(
                'INSERT INTO dishes (user_id, name, products) VALUES ($1,$2,$3)',
                [user_id, name, products]
            );
            res.status(200).json({
                message: 'Блюдо создано',
                status: 'Успешно',
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Ошибка сервера',
                status: 'Неудача',
            });
        }
    }
    async loadDishList(req, res) {
        const id = req.params.id;
        const poolResponse = await pool.query(
            'SELECT * FROM dishes WHERE user_id=$1',
            [id]
        );
        const res1 = poolResponse.rows;

        for (let i = 0; i < res1.length; i++) {
            let calories = 0;
            let protein = 0;
            let fat = 0;
            let carbs = 0;

            if (res1[i].products && res1[i].products.length > 0) {
                const products_to_search = res1[i].products
                    .replace('{', '')
                    .replace('}', '')
                    .replaceAll('"', '')
                    .split(',');

                for (const product of products_to_search) {
                    const poolResponse2 = await pool.query(
                        'SELECT calories, protein, fat, carbs FROM products WHERE name=$1',
                        [product]
                    );
                    if (poolResponse2.rows.length > 0) {
                        calories +=
                            parseInt(poolResponse2.rows[0].calories) || 0;
                        protein += parseInt(poolResponse2.rows[0].protein) || 0;
                        fat += parseInt(poolResponse2.rows[0].fat) || 0;
                        carbs += parseInt(poolResponse2.rows[0].carbs) || 0;
                    }
                }
            }

            res1[i].calories = calories;
            res1[i].protein = protein;
            res1[i].fat = fat;
            res1[i].carbs = carbs;
        }

        res.json(res1);
    }
    async deleteDish(req, res) {
        const { name } = req.body;
        const poolResponse = await pool.query(
            'DELETE FROM dishes WHERE name=$1',
            [name]
        );
        res.json({ message: 'Блюдо успешно удалено', status: 'Успех' });
    }
    async createMeal(req, res) {
        const { user_id, day, meal, dish } = req.body;
        const poolResponse0 = await pool.query(
            'SELECT day_week, meal FROM dishes WHERE user_id=$1 AND name=$2',
            [user_id, dish]
        );
        var days;
        var meals;
        if (poolResponse0.rows[0].day_week != null) {
            days = poolResponse0.rows[0].day_week + ', ' + day;
            meals = poolResponse0.rows[0].meal + ', ' + meal;
        } else {
            days = day;
            meals = meal;
        }
        const poolResponse = await pool.query(
            'UPDATE dishes SET day_week =$1, meal=$2 WHERE user_id=$3 AND name=$4 RETURNING *',
            [days, meals, user_id, dish]
        );
        res.status(200).json({ message: 'ВСЕ ЧЕТКО' });
    }
    async getUserProfile(req, res) {
        try {
            const token = req.cookies.auth_token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const result = await pool.query(
                'SELECT about FROM users WHERE id = $1',
                [decoded.id]
            );

            res.json({ about: result.rows[0]?.about || '' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Server error' });
        }
    }
    async updateAbout(req, res) {
        try {
            const { about } = req.body;
            const token = req.cookies.auth_token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            await pool.query('UPDATE users SET about = $1 WHERE id = $2', [
                about,
                decoded.id,
            ]);

            res.json({ success: true });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Server error' });
        }
    }
}

export default new apiController();
