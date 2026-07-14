const mysql = require('mysql2/promise');

let pool;

const getPool = async () => {
    if (!pool) {
        const tempPool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            waitForConnections: true,
            connectionLimit: 10
        });
        await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        await tempPool.end();

        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10
        });
    }
    return pool;
};

module.exports = { getPool };
