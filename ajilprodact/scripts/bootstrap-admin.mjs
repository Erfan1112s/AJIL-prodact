import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import mysql from 'mysql2/promise';
import { emitKeypressEvents } from 'node:readline';

const scryptAsync = promisify(scrypt);
const username = 'admin';
const requiredTables = [
  'admin_users',
  'users',
  'roles',
  'permissions',
  'role_permissions',
];

function requireDatabaseConfiguration() {
  for (const name of ['DB_USER', 'DB_NAME']) {
    if (!process.env[name]) {
      throw new Error(`متغیر محیطی ${name} تنظیم نشده است.`);
    }
  }
}

async function readHiddenPassword(prompt) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('اجرای این ابزار به ترمینال تعاملی نیاز دارد.');
  }

  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdout.write(prompt);

  return new Promise((resolve, reject) => {
    let password = '';
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      process.stdin.off('keypress', onKeypress);
      process.stdin.off('end', onEnd);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(password);
    };
    const onEnd = () => finish(new Error('ورودی پایان یافت.'));
    const onKeypress = (character, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        finish(new Error('عملیات لغو شد.'));
      } else if (key.name === 'return' || key.name === 'enter') {
        finish();
      } else if (key.name === 'backspace') {
        password = [...password].slice(0, -1).join('');
      } else if (character && !key.ctrl && !key.meta) {
        password += character;
      }
    };

    process.stdin.on('keypress', onKeypress);
    process.stdin.once('end', onEnd);
  });
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

async function main() {
  if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
    throw new Error('نام کاربری باید ۳ تا ۵۰ نویسه و فقط شامل حروف، عدد یا _ باشد.');
  }

  requireDatabaseConfiguration();

  const password = await readHiddenPassword('رمز قوی (حداقل ۱۶ نویسه): ');
  const confirmation = await readHiddenPassword('تکرار رمز عبور: ');
  if (password.length < 16) {
    throw new Error('رمز عبور production باید حداقل ۱۶ نویسه باشد.');
  }
  if (password !== confirmation) {
    throw new Error('دو رمز واردشده یکسان نیستند.');
  }

  const passwordHash = await hashPassword(password);
  const pool = mysql.createPool({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4_unicode_ci',
    timezone: '+03:30',
    connectionLimit: 1,
    multipleStatements: false,
  });

  let connection;
  try {
    connection = await pool.getConnection();
    const [tables] = await connection.query(
      `SELECT TABLE_NAME
       FROM information_schema.tables
       WHERE table_schema = DATABASE()
         AND table_name IN (?, ?, ?, ?, ?)`,
      requiredTables
    );
    const existingTables = new Set(tables.map((table) => table.TABLE_NAME));
    const missingTables = requiredTables.filter((table) => !existingTables.has(table));
    if (missingTables.length > 0) {
      throw new Error(
        `جدول‌های لازم وجود ندارند؛ ابتدا migration مربوط به کاربران را اجرا کنید: ${missingTables.join(', ')}`
      );
    }

    const [[admin]] = await connection.query(
      'SELECT id FROM admin_users WHERE username = ? LIMIT 1',
      [username]
    );
    const [[unifiedUser]] = await connection.query(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    if (admin || unifiedUser) {
      throw new Error(
        `نام کاربری "${username}" از قبل وجود دارد؛ حساب موجود تغییر نکرد.`
      );
    }

    const [[role]] = await connection.query(
      'SELECT id FROM roles WHERE name = ? LIMIT 1',
      ['SUPER_ADMIN']
    );
    if (!role) {
      throw new Error('نقش SUPER_ADMIN یافت نشد؛ migration کاربران را بررسی کنید.');
    }
    const [[permissionCount]] = await connection.query(
      'SELECT COUNT(*) AS count FROM permissions'
    );
    if (Number(permissionCount.count) === 0) {
      throw new Error('مجوزی در پایگاه داده تعریف نشده؛ migration کاربران را بررسی کنید.');
    }

    await connection.beginTransaction();
    try {
      const [adminResult] = await connection.query(
        `INSERT INTO admin_users (username, password_hash, full_name, role, is_active)
         VALUES (?, ?, ?, 'SUPER_ADMIN', 1)`,
        [username, passwordHash, 'مدیر سیستم']
      );
      const adminId = adminResult.insertId;

      await connection.query(
        `INSERT INTO users (
           phone, username, email, password_hash, full_name, national_code,
           user_type, role_id, staff_id, is_active
         ) VALUES (NULL, ?, NULL, ?, ?, NULL, 'STAFF', ?, ?, 1)`,
        [username, passwordHash, 'مدیر سیستم', role.id, adminId]
      );
      await connection.query(
        `INSERT IGNORE INTO role_permissions (role_id, permission_id)
         SELECT ?, id FROM permissions`,
        [role.id]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    console.log(`حساب ${username} با نقش SUPER_ADMIN ایجاد شد.`);
    console.log('رمز عبور در دیتابیس فقط به‌صورت هش‌شده ذخیره شده است.');
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'ایجاد حساب ناموفق بود.');
  process.exitCode = 1;
});
