CREATE TABLE users (
    id SERIAL PRIMARY KEY,          -- auto-incrementing integer id
    name TEXT NOT NULL,             -- user name
    email TEXT UNIQUE NOT NULL,     -- must be unique
    password TEXT NOT NULL,         -- store hashed passwords here
    created_at TIMESTAMP DEFAULT NOW()
);
