const { getPool } = require('./connection');

const migrate = async () => {
    const db = await getPool();

    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            telegram_id BIGINT UNIQUE NOT NULL,
            username VARCHAR(255),
            role ENUM('owner', 'admin', 'user') DEFAULT 'user',
            saldo INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            telegram_id BIGINT UNIQUE NOT NULL,
            added_by BIGINT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            photo_enabled BOOLEAN DEFAULT FALSE,
            photo_id VARCHAR(255) DEFAULT NULL,
            welcome_message TEXT DEFAULT NULL,
            rating DECIMAL(2,1) DEFAULT 5.0,
            reviews INT DEFAULT 0,
            trxall INT DEFAULT 0,
            alluser INT DEFAULT 0,
            backup_interval VARCHAR(10) DEFAULT NULL,
            pakasir_slug VARCHAR(255) DEFAULT 'fastx',
            pakasir_apikey VARCHAR(255) DEFAULT 't49xriyZJgGFC02PvgXJX5KreOa03fYJ'
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS deposits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id VARCHAR(100) UNIQUE NOT NULL,
            user_id BIGINT NOT NULL,
            amount INT NOT NULL,
            status ENUM('pending', 'completed', 'expired') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id VARCHAR(100) UNIQUE NOT NULL,
            user_id BIGINT NOT NULL,
            product_id INT NOT NULL,
            qty INT NOT NULL,
            amount INT NOT NULL,
            status ENUM('pending', 'completed', 'expired') DEFAULT 'pending',
            payment_method VARCHAR(50) DEFAULT 'qris',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category_id INT NOT NULL,
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            price INT NOT NULL,
            description TEXT,
            snk TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS stocks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    `);

    await db.query(`INSERT IGNORE INTO settings (id) VALUES (1)`);
};

module.exports = { migrate };

