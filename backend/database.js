import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Crear pool de conexiones en lugar de conexión única
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'contratacion_temporales_b',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('✅ Pool de conexiones MySQL creado');
export default db;