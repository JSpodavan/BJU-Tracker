# Сайт для планирования питания 🥗

Веб-приложение для отслеживания питания, поиска продуктов, создания блюд и планирования рациона на неделю.

## 🛠 Технологии

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT, bcryptjs
- **Frontend:** HTML, CSS, JavaScript (чистый)
- **Charts:** Chart.js
- **Icons:** Font Awesome

## 🚀 Возможности

- 🔐 Регистрация и авторизация
- 🔍 Поиск продуктов с информацией о БЖУ
- ⭐ Добавление продуктов в избранное
- 🍳 Создание блюд из нескольких продуктов
- 📅 Планирование питания на неделю
- 📊 Отслеживание активности и статистики
- 🏆 Система достижений

## 📋 Требования

- Node.js 18+
- PostgreSQL

## ⚡ Установка

### 1. Клонируйте репозиторий
```bash
git clone https://github.com/JSpodavan/BJU-Tracker.git
cd project
```

### 2. Установите зависимости
```bash
npm install
```

### 3. Настройте переменные окружения

Скопируйте файл `.env.example` в `.env` и заполните свои данные:

```bash
cp .env.example .env
```

Отредактируйте `.env`:
```env
# Server
PORT=5000

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=ваш_пароль
PG_DATABASE=название_бд

# JWT
JWT_SECRET=любой_секретный_ключ

# Edamam API (https://developer.edamam.com/)
EDAMAM_ID=ваш_app_id
EDAMAM_KEY=ваш_app_key

# Email для восстановления пароля
EMAIL=ваш_email@gmail.com
EMAIL_PASS=пароль_приложения_google
```

### 4. Настройте базу данных

Создайте пустую базу данных в PostgreSQL:
```sql
CREATE DATABASE your_database_name;
```

### 5. Запустите сервер
```bash
node server.js
```

### 6. Откройте в браузере
```
http://localhost:5000
```

## 📁 Структура проекта

```
├── server.js              # Главный файл сервера
├── db.js                  # Подключение к PostgreSQL
├── .env                   # Переменные окружения
├── .env.example           # Пример переменных окружений
├── package.json           # Зависимости
│
├── routes/
│   ├── user-routes.js     # Роуты авторизации
│   └── api-routes.js      # Роуты API
│
├── controller/
│   ├── user-controller.js # Логика авторизации
│   └── api-controller.js  # Логика API
│
├── public/
│   └── (фронтенд файлы)
│
└── index.html             # Главная страница (SPA)
```

## 🔧 API Endpoints

### Авторизация
- `POST /user` — Регистрация
- `POST /user/login` — Вход
- `GET /user/auth` — Проверка токена
- `POST /user/logout` — Выход
- `POST /user/send-reset-email` — Восстановление пароля
- `POST /user/switch-password` — Смена пароля

### Продукты и блюда
- `POST /api/search` — Поиск продуктов
- `POST /api/favourite` — Добавить в избранное
- `GET /api/loadFavourite` — Получить избранное
- `DELETE /api/deleteFavourite` — Удалить из избранного
- `POST /api/createDish` — Создать блюдо
- `GET /api/DishList/:id` — Получить список блюд
- `DELETE /api/deleteDish` — Удалить блюдо
- `POST /api/createMeal` — Добавить блюдо в план питания
- `GET /api/activity` — Получить статистику активности
