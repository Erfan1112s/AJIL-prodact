// lib/db.ts
import mysql, { type Pool } from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: Pool | undefined;
}

function createPool(): Pool {
  return mysql.createPool({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 60_000,
    queueLimit: 0,
    charset: 'utf8mb4_unicode_ci',
    timezone: '+03:30',
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    multipleStatements: false,
    decimalNumbers: true,
  });
}

export const db: Pool = global.__mysqlPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  global.__mysqlPool = db;
}

/**
 * اجرای SELECT و برگرداندن ردیف‌ها با تایپ مشخص
 * از مشکل تایپ mysql2 که QueryResult می‌خواهد عبور می‌کند
 */
export async function queryRows<T>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows] = await db.query(sql, params as any);
  return rows;
}

/**
 * اجرای INSERT/UPDATE/DELETE
 */
export async function execute(
  sql: string,
  params?: unknown[]
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.query(sql, params as any);
}

/**
 * تراکنش
 */
export async function transaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

