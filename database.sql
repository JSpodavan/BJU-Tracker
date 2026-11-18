-- Схема базы данных BJU-Tracker

CREATE TABLE users (
    id                         SERIAL PRIMARY KEY,
    name                       VARCHAR(100) NOT NULL,
    email                      VARCHAR(255) NOT NULL UNIQUE,
    password                   VARCHAR(255) NOT NULL,
    about                      TEXT,
    email_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token         VARCHAR(64),
    verification_token_expires TIMESTAMP,
    reset_token                VARCHAR(255),
    reset_token_time           TIMESTAMP
);

CREATE TABLE products (
    id       SERIAL PRIMARY KEY,
    name     VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100),
    calories INTEGER,
    protein  INTEGER,
    fat      INTEGER,
    carbs    INTEGER
);

CREATE TABLE history (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE favourite (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (user_id, product_id)
);

CREATE TABLE dishes (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    products   TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE history_dishes (
    id       SERIAL PRIMARY KEY,
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_id  INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    day_week VARCHAR(20) NOT NULL,
    meal     VARCHAR(20) NOT NULL,
    week     VARCHAR(50) NOT NULL
);
