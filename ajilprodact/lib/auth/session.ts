// lib/auth/session.ts
// مدیریت session ادمین با کوکی امضاشده HMAC
// از Web Crypto API استفاده می‌کند تا در Edge Runtime (Middleware) کار کند

import { cookies } from 'next/headers';

// نام کوکی
export const SESSION_COOKIE = 'ajil_admin_session';

// مدت اعتبار session به ثانیه (۷ روز)
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

// دریافت کلید مخفی از متغیرهای محیطی
function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'ADMIN_SESSION_SECRET باید حداقل 32 کاراکتر باشد. در .env.local تنظیم کنید.'
    );
  }
  return secret;
}

// تبدیل رشته hex به Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// تبدیل Uint8Array به رشته hex
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ساخت کلید HMAC از secret
async function getHmacKey(): Promise<CryptoKey> {
  const secret = getSecret();
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// ساخت امضای HMAC برای payload
async function sign(payload: string): Promise<string> {
  const key = await getHmacKey();
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  return bytesToHex(new Uint8Array(signature));
}

// بررسی امضا به صورت امن (constant-time)
async function verifySignature(
  payload: string,
  signatureHex: string
): Promise<boolean> {
  try {
    const key = await getHmacKey();
    const encoder = new TextEncoder();
    const signatureBytes = hexToBytes(signatureHex);

    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(payload)
    );
  } catch {
    return false;
  }
}

/**
 * ساخت توکن session
 * فرمت: payload.signature
 */
export async function createSessionToken(userId: number): Promise<string> {
  const expiry = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${userId}.${expiry}`;
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

/**
 * بررسی توکن session
 * اگر معتبر بود، userId را برمی‌گرداند
 */
export async function verifySessionToken(
  token: string
): Promise<number | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [userIdStr, expiryStr, signature] = parts;
    const payload = `${userIdStr}.${expiryStr}`;

    // بررسی امضا
    const valid = await verifySignature(payload, signature);
    if (!valid) return null;

    // بررسی انقضا
    const expiry = Number(expiryStr);
    if (!Number.isFinite(expiry) || Date.now() > expiry) return null;

    // بررسی userId
    const userId = Number(userIdStr);
    if (!Number.isInteger(userId) || userId <= 0) return null;

    return userId;
  } catch {
    return null;
  }
}

/**
 * ست کردن کوکی session
 */
export async function setSessionCookie(userId: number): Promise<void> {
  const token = await createSessionToken(userId);
  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * پاک کردن کوکی session
 */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * خواندن userId از کوکی فعلی
 */
export async function getCurrentUserId(): Promise<number | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}