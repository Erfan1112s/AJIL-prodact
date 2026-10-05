// lib/auth/customer-session.ts
// session مشتری - جدا از session ادمین
// از Web Crypto API برای سازگاری با Edge Runtime استفاده می‌کند

import { cookies } from 'next/headers';

export const CUSTOMER_SESSION_COOKIE = 'ajil_customer_session';

// مدت اعتبار: 30 روز (مشتری‌ها باید مدت طولانی لاگین بمانند)
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function getSecret(): string {
  const secret = process.env.CUSTOMER_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'CUSTOMER_SESSION_SECRET باید حداقل 32 کاراکتر باشد'
    );
  }
  return secret;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

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

export async function createCustomerSession(
  customerId: number
): Promise<string> {
  const expiry = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${customerId}.${expiry}`;
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function verifyCustomerSession(
  token: string
): Promise<number | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [idStr, expiryStr, signature] = parts;
    const payload = `${idStr}.${expiryStr}`;

    const valid = await verifySignature(payload, signature);
    if (!valid) return null;

    const expiry = Number(expiryStr);
    if (!Number.isFinite(expiry) || Date.now() > expiry) return null;

    const id = Number(idStr);
    if (!Number.isInteger(id) || id <= 0) return null;

    return id;
  } catch {
    return null;
  }
}

export async function setCustomerSessionCookie(
  customerId: number
): Promise<void> {
  const token = await createCustomerSession(customerId);
  const store = await cookies();
  store.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearCustomerSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(CUSTOMER_SESSION_COOKIE);
}

export async function getCurrentCustomerId(): Promise<number | null> {
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyCustomerSession(token);
}