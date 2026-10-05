// lib/auth/password.ts
// هش و بررسی رمز عبور با استفاده از crypto داخلی Node.js
// بدون نیاز به bcrypt یا هیچ پکیج خارجی

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

// تبدیل scrypt callback-based به Promise
const scryptAsync = promisify(scrypt);

// طول هش به بایت
const HASH_LENGTH = 64;

// طول salt به بایت
const SALT_LENGTH = 16;

/**
 * هش کردن رمز عبور
 * فرمت خروجی: salt:hash
 * هر دو به صورت hex ذخیره می‌شوند
 */
export async function hashPassword(password: string): Promise<string> {
  // تولید salt تصادفی
  const salt = randomBytes(SALT_LENGTH);

  // هش رمز با scrypt
  const derivedKey = (await scryptAsync(password, salt, HASH_LENGTH)) as Buffer;

  // ترکیب salt و hash با :
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

/**
 * بررسی رمز عبور با هش ذخیره‌شده
 * true اگر مطابق بود
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    // جداسازی salt و hash
    const [saltHex, hashHex] = storedHash.split(':');
    if (!saltHex || !hashHex) return false;

    const salt = Buffer.from(saltHex, 'hex');
    const expectedHash = Buffer.from(hashHex, 'hex');

    // هش رمز ورودی با همان salt
    const derivedKey = (await scryptAsync(
      password,
      salt,
      HASH_LENGTH
    )) as Buffer;

    // مقایسه امن (جلوگیری از timing attack)
    // timingSafeEqual فقط اگر طول‌ها برابر باشند کار می‌کند
    if (derivedKey.length !== expectedHash.length) return false;

    return timingSafeEqual(derivedKey, expectedHash);
  } catch {
    return false;
  }
}