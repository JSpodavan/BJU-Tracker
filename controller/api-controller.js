import pool from '../db.js';
import 'dotenv/config';
import jwt from 'jsonwebtoken';

// id пользователя берём только из токена авторизации. Раньше часть запросов
// брала user_id из тела запроса / URL, и любой мог работать с чужими блюдами.
function getUserId(req) {
    try {
        const decoded = jwt.verify(
            req.cookies.auth_token,
            process.env.JWT_SECRET
        );
        return decoded.id;
    } catch (error) {
        return null;
    }
}

function unauthorized(res) {
    return res.status(401).json({ error: 'Требуется авторизация' });
}

// Поле dishes.products хранится как текст вида {"chicken breast",rice}
// (так pg сериализует JS-массив). Разбираем его корректно, с учётом кавычек
// и запятых внутри названий.
function parseProducts(value) {
    if (!value) return [];
    let str = String(value).trim();
    if (str.startsWith('[')) {
        try {
            return JSON.parse(str);
        } catch (e) {}
    }
    if (str.startsWith('{') && str.endsWith('}')) str = str.slice(1, -1);
    const result = [];
    let current = '';
    let inQuotes = false;
    let wasQuoted = false;
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (inQuotes) {
            if (ch === '\\' && i + 1 < str.length) {
                current += str[++i];
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
            wasQuoted = true;
        } else if (ch === ',') {
            result.push(wasQuoted ? current : current.trim());
            current = '';
            wasQuoted = false;
        } else {
            current += ch;
        }
    }
    if (current.length || wasQuoted) {
        result.push(wasQuoted ? current : current.trim());
    }
    return result.filter((p) => p !== '');
}

function detectCategory(categories) {
    for (let item of categories) {
        if (item.includes('fruits')) return 'Фрукты';
        if (item.includes('vegetables')) return 'Овощи';
        if (item.includes('snacks')) return 'Снеки';
        if (item.includes('meats')) return 'Мясо';
        if (item.includes('nuts')) return 'Орехи';
        if (item.includes('seafood')) return 'Морепродукты';
        if (item.includes('plant-based-foods')) return 'Растительная пища';
    }
    return '';
}

class apiController {
    async search(req, res) {
        const userId = getUserId(req);
        if (!userId) return unauthorized(res);
        const product = (req.body?.product || '').trim();
        if (!product) {
            return res.json({ exsists: false });
        }
        try {
            // Сначала ищем продукт в своей БД (без учёта регистра)
            const existing = await pool.query(
                'SELECT * FROM products WHERE LOWER(name)=LOWER($1)',
                [product]
            );
            if (existing.rows.length != 0) {
                const found = existing.rows[0];
                const inHistory = await pool.query(
                    'SELECT 1 FROM history WHERE user_id=$1 AND product_id=$2',
                    [userId, found.id]
                );
                if (inHistory.rows.length != 0) {
                    // Возвращаем и сами данные, чтобы их можно было показать
                    return res.json({ alreadyExsist: true, ...found });
                }
                await pool.query(
                    'INSERT INTO history (user_id, product_id) VALUES ($1, $2)',
                    [userId, found.id]
                );
                return res.json(found);
            }

            // Нет в БД — запрашиваем Edamam
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
            const nutrients = data?.hints?.[0]?.food?.nutrients;
            if (!nutrients) {
                return res.json({ exsists: false });
            }

            // Категория — дополнительная информация. Если OpenFoodFacts
            // ничего не нашёл или недоступен, продукт всё равно сохраняем.
            let category = '';
            try {
                const response1 = await fetch(
                    `https://world.openfoodfacts.org/api/v2/search?categories_tags=${encodeURIComponent(
                        product
                    )}&fields=categories_tags&page_size=1`
                );
                const categories = await response1.json();
                if (categories?.products?.length) {
                    category = detectCategory(
                        categories.products[0].categories_tags || []
                    );
                }
            } catch (error) {
                console.log('OpenFoodFacts error:', error.message);
            }

            const values = {
                name: product,
                category: category,
                calories: Math.floor(nutrients.ENERC_KCAL || 0),
                protein: Math.floor(nutrients.PROCNT || 0),
                fat: Math.floor(nutrients.FAT || 0),
                carbs: Math.floor(nutrients.CHOCDF || 0),
            };
            const inserted = await pool.query(
                'INSERT INTO products (name, category, calories, protein, fat, carbs) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [
                    values.name,
                    values.category,
                    values.calories,
                    values.protein,
                    values.fat,
                    values.carbs,
                ]
            );
            await pool.query(
                'INSERT INTO history (user_id, product_id) VALUES ($1, $2)',
                [userId, inserted.rows[0].id]
            );
            res.json(inserted.rows[0]);
        } catch (error) {
            console.log('Search error:', error);
            res.status(500).json({ error: 'Ошибка поиска' });
        }
    }
    async loadHistory(req, res) {
        const userId = getUserId(req);
        if (!userId) return unauthorized(res);
        try {
            // 6 последних найденных продуктов, от новых к старым
            const result = await pool.query(
                `SELECT p.* FROM history h
                 JOIN products p ON p.id = h.product_id
                 WHERE h.user_id=$1
                 ORDER BY h.created_at DESC, h.id DESC
                 LIMIT 6`,
                [userId]
            );
            res.json(result.rows);
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Server error' });
        }
    }
    async addFavourite(req, res) {
        try {
            const { name } = req.body;
            const userId = getUserId(req);
            if (!userId) return unauthorized(res);
            const poolResponse = await pool.query(
                'SELECT id FROM products WHERE name=$1',
                [name]
            );
            if (poolResponse.rows.length == 0) {
                return res.json({ answer: 'Продукт не найден' });
            }
            const productId = poolResponse.rows[0].id;
            const poolResponse2 = await pool.query(
                'SELECT * FROM favourite WHERE user_id=$1 AND product_id=$2',
                [userId, productId]
            );
            if (poolResponse2.rows.length == 0) {
                await pool.query(
                    'INSERT INTO favourite(user_id, product_id) VALUES($1, $2)',
                    [userId, productId]
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
        const userId = getUserId(req);
        if (!userId) return unauthorized(res);
        try {
            const result = await pool.query(
                `SELECT p.* FROM favourite f
                 JOIN products p ON p.id = f.product_id
                 WHERE f.user_id=$1
                 ORDER BY f.id`,
                [userId]
            );
            res.json({
                products: result.rows,
                products_ids: result.rows.map((p) => p.id),
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Server error' });
        }
    }
    async deleteFavourite(req, res) {
        try {
            const { name } = req.body;
            const userId = getUserId(req);
            if (!userId) return unauthorized(res);
            await pool.query(
                'DELETE FROM favourite WHERE user_id=$1 AND product_id IN (SELECT id FROM products WHERE name=$2)',
                [userId, name]
            );
            res.json({ answer: `Вы удалили продукт : ${name}` });
        } catch (error) {
            console.log(error);
            res.status(500).json({ answer: 'Произошла ошибка' });
        }
    }
    async createDish(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) return unauthorized(res);
            const name = (req.body?.name || '').trim();
            const products = Array.isArray(req.body?.products)
                ? req.body.products
                : [];
            if (!name) {
                return res.status(400).json({
                    message: 'Введите название блюда',
                    status: 'Неудача',
                });
            }
            const exists = await pool.query(
                'SELECT 1 FROM dishes WHERE user_id=$1 AND name=$2',
                [userId, name]
            );
            if (exists.rows.length) {
                return res.status(400).json({
                    message: 'Блюдо с таким названием уже есть',
                    status: 'Неудача',
                });
            }
            await pool.query(
                'INSERT INTO dishes (user_id, name, products) VALUES ($1,$2,$3)',
                [userId, name, products]
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
        // :id в адресе оставлен для совместимости, но не используется —
        // блюда отдаются только владельцу токена
        const id = getUserId(req);
        if (!id) return unauthorized(res);
        const { week } = req.query;

        try {
            const dishesResponse = await pool.query(
                'SELECT * FROM dishes WHERE user_id=$1 ORDER BY id',
                [id]
            );
            const dishes = dishesResponse.rows;

            // Считаем БЖУ каждого блюда
            for (let i = 0; i < dishes.length; i++) {
                let calories = 0,
                    protein = 0,
                    fat = 0,
                    carbs = 0;

                const productsList = parseProducts(dishes[i].products);
                for (const product of productsList) {
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
                dishes[i].productsList = productsList;
                dishes[i].calories = calories;
                dishes[i].protein = protein;
                dishes[i].fat = fat;
                dishes[i].carbs = carbs;
            }

            let mealPlan = [];
            let weeklyTotals = { calories: 0, protein: 0, fat: 0, carbs: 0 };
            if (week) {
                const mealResponse = await pool.query(
                    'SELECT hd.day_week, hd.meal, d.name, d.id FROM history_dishes hd JOIN dishes d ON hd.meal_id = d.id WHERE hd.user_id = $1 AND hd.week = $2 ORDER BY hd.id',
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
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        }
    }
    async deleteDish(req, res) {
        const userId = getUserId(req);
        if (!userId) return unauthorized(res);
        try {
            const { name } = req.body;
            // Удаляем только блюдо текущего пользователя (раньше удалялись
            // блюда с таким названием у всех пользователей).
            // Записи из history_dishes удалятся каскадно.
            await pool.query('DELETE FROM dishes WHERE user_id=$1 AND name=$2', [
                userId,
                name,
            ]);
            res.json({ message: 'Блюдо успешно удалено', status: 'Успех' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
    async createMeal(req, res) {
        try {
            const user_id = getUserId(req);
            if (!user_id) return unauthorized(res);
            const { day, meal, dish, week } = req.body;

            const dishResponse = await pool.query(
                'SELECT id FROM dishes WHERE user_id=$1 AND name=$2',
                [user_id, dish]
            );

            if (dishResponse.rows.length === 0) {
                return res.status(404).json({ message: 'Блюдо не найдено' });
            }

            const dishId = dishResponse.rows[0].id;

            await pool.query(
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
            const userId = getUserId(req);
            if (!userId) return unauthorized(res);

            const result = await pool.query(
                'SELECT about FROM users WHERE id = $1',
                [userId]
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
            const userId = getUserId(req);
            if (!userId) return unauthorized(res);

            await pool.query('UPDATE users SET about = $1 WHERE id = $2', [
                about,
                userId,
            ]);

            res.json({ success: true });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Server error' });
        }
    }
    async getActivityData(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: 'No token provided' });
            }
            // to_char — чтобы дата приходила строкой без сдвига часового пояса
            const searchData = await pool.query(
                `SELECT to_char(created_at::date, 'YYYY-MM-DD') as date, COUNT(*) as count
                 FROM history WHERE user_id = $1 AND created_at IS NOT NULL
                 GROUP BY created_at::date
                 ORDER BY created_at::date DESC LIMIT 7`,
                [userId]
            );

            const dishData = await pool.query(
                `SELECT to_char(created_at::date, 'YYYY-MM-DD') as date, COUNT(*) as count
                 FROM dishes WHERE user_id = $1 AND created_at IS NOT NULL
                 GROUP BY created_at::date
                 ORDER BY created_at::date DESC LIMIT 7`,
                [userId]
            );

            const totalSearches = await pool.query(
                'SELECT COUNT(*) as count FROM history WHERE user_id = $1',
                [userId]
            );

            const totalDishes = await pool.query(
                'SELECT COUNT(*) as count FROM dishes WHERE user_id = $1',
                [userId]
            );

            const totalFavorites = await pool.query(
                'SELECT COUNT(*) as count FROM favourite WHERE user_id = $1',
                [userId]
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
