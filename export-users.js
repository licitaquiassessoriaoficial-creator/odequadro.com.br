const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

// Configuração igual ao database-mysql.js
const databaseUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
let poolConfig;
if (databaseUrl) {
  const url = new URL(databaseUrl);
  poolConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000
  };
} else if (process.env.MYSQLHOST) {
  poolConfig = {
    host: process.env.MYSQLHOST,
    port: parseInt(process.env.MYSQLPORT) || 3306,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000
  };
} else {
  throw new Error('Nenhuma configuração MySQL válida encontrada.');
}

async function exportUsers() {
  const pool = mysql.createPool(poolConfig);
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM users');
    fs.writeFileSync('backup_usuarios.json', JSON.stringify(rows, null, 2), 'utf8');
    console.log('✅ Usuários exportados para backup_usuarios.json');
  } catch (err) {
    console.error('❌ Erro ao exportar usuários:', err);
  } finally {
    connection.release();
    pool.end();
  }
}

exportUsers();
