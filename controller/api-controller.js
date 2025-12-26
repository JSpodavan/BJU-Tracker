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
        const { week } = req.query;

        // Load all dishes for the user
        const dishesResponse = await pool.query(
            'SELECT * FROM dishes WHERE user_id=$1',
            [id]
        );
        const dishes = dishesResponse.rows;

        // Calculate nutrition for each dish
        for (let i = 0; i < dishes.length; i++) {
            let calories = 0,
                protein = 0,
                fat = 0,
                carbs = 0;

            if (dishes[i].products && dishes[i].products.length > 0) {
                const products_to_search = dishes[i].products
                    .replace('{', '')
                    .replace('}', '')
                    .replaceAll('"', '')
                    .split(',');

                for (const product of products_to_search) {
                    const productResponse = await pool.query(
                        'SELECT calories, protein, fat, carbs FROM products WHERE name=$1',
                        [product]
                    );
                    if (productResponse.rows.length > 0) {
                        calories +=
                            parseInt(productResponse.rows[0].calories) || 0;
                        protein +=
                            parseInt(productResponse.rows[0].protein) || 0;
                        fat += parseInt(productResponse.rows[0].fat) || 0;
                        carbs += parseInt(productResponse.rows[0].carbs) || 0;
                    }
                }
            }
            dishes[i].calories = calories;
            dishes[i].protein = protein;
            dishes[i].fat = fat;
            dishes[i].carbs = carbs;
        }

        let mealPlan = [];
        let weeklyTotals = { calories: 0, protein: 0, fat: 0, carbs: 0 };
        if (week) {
            const mealResponse = await pool.query(
                'SELECT hd.day_week, hd.meal, d.name, d.id FROM history_dishes hd JOIN dishes d ON hd.meal_id = d.id WHERE hd.user_id = $1 AND hd.week = $2',
                [id, week]
            );
            mealPlan = mealResponse.rows;

            for (const meal of mealPlan) {
                const dish = dishes.find((d) => d.id == meal.id);
                if (dish) {
                    weeklyTotals.calories += dish.calories || 0;
                    weeklyTotals.protein += dish.protein || 0;
                    weeklyTotals.fat += dish.fat || 0;
                    weeklyTotals.carbs += dish.carbs || 0;
                }
            }
        }

        res.json({ dishes, mealPlan, weeklyTotals });
    }
    async deleteDish(req, res) {
        const { name } = req.body;
        const poolResponse123 = await pool.query(
            'DELETE FROM history_dishes WHERE meal_id IN (SELECT id FROM dishes WHERE name=$1)',
            [name]
        );
        const poolResponse = await pool.query(
            'DELETE FROM dishes WHERE name=$1',
            [name]
        );
        res.json({ message: 'Блюдо успешно удалено', status: 'Успех' });
    }
    async createMeal(req, res) {
        try {
            const { user_id, day, meal, dish, week } = req.body;

            // Get dish ID from dish name
            const dishResponse = await pool.query(
                'SELECT id FROM dishes WHERE user_id=$1 AND name=$2',
                [user_id, dish]
            );

            if (dishResponse.rows.length === 0) {
                return res.status(404).json({ message: 'Блюдо не найдено' });
            }

            const dishId = dishResponse.rows[0].id;

            // Insert into history_dishes table
            const poolResponse = await pool.query(
                'INSERT INTO history_dishes (user_id, meal_id, day_week, meal, week) VALUES ($1, $2, $3, $4, $5)',
                [user_id, dishId, day, meal, week]
            );

            res.status(200).json({
                message: 'Блюдо успешно добавлено в план питания',
            });
        } catch (error) {
            console.error('Error creating meal:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
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
    async getActivityData(req, res) {
        try {
            const token = req.cookies.auth_token;
            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            let searchData, dishData;
            try {
                searchData = await pool.query(
                    `SELECT created_at::date as date, COUNT(*) as count 
                     FROM history WHERE user_id = $1 AND created_at IS NOT NULL
                     GROUP BY created_at::date 
                     ORDER BY date DESC LIMIT 7`,
                    [decoded.id]
                );
            } catch (err) {
                searchData = { rows: [] };
            }

            try {
                dishData = await pool.query(
                    `SELECT created_at::date as date, COUNT(*) as count 
                     FROM dishes WHERE user_id = $1 AND created_at IS NOT NULL
                     GROUP BY created_at::date 
                     ORDER BY date DESC LIMIT 7`,
                    [decoded.id]
                );
            } catch (err) {
                dishData = { rows: [] };
            }

            // Get total counts
            const totalSearches = await pool.query(
                'SELECT COUNT(*) as count FROM history WHERE user_id = $1',
                [decoded.id]
            );

            const totalDishes = await pool.query(
                'SELECT COUNT(*) as count FROM dishes WHERE user_id = $1',
                [decoded.id]
            );

            const totalFavorites = await pool.query(
                'SELECT COUNT(*) as count FROM favourite WHERE user_id = $1',
                [decoded.id]
            );

            res.json({
                searches: searchData.rows || [],
                dishes: dishData.rows || [],
                stats: {
                    totalSearches: parseInt(totalSearches.rows[0].count) || 0,
                    totalDishes: parseInt(totalDishes.rows[0].count) || 0,
                    totalFavorites: parseInt(totalFavorites.rows[0].count) || 0,
                },
            });
        } catch (error) {
            console.log('Activity data error:', error);
            res.status(500).json({
                error: 'Server error',
                details: error.message,
            });
        }
    }
}

export default new apiController();
