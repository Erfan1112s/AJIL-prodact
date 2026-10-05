// scripts/generate-admin-hash.mjs
// تولید هش رمز ادمین برای وارد کردن در دیتابیس
// اجرا: node scripts/generate-admin-hash.mjs رمز-مورد-نظر

import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const password = process.argv[2];
if (!password) {
  console.error('استفاده: node scripts/generate-admin-hash.mjs رمز-مورد-نظر');
  process.exit(1);
}

const salt = randomBytes(16);
const derivedKey = await scryptAsync(password, salt, 64);
const hash = `${salt.toString('hex')}:${derivedKey.toString('hex')}`;

console.log(hash);

// 116b472447e6017bac54bb916222b289:aff8380c1776e9a89f0ff1a42f1628811c9d7fefa6404cbbce8edd8c98c3aceec43112b51a33df195ad6e4640ea927ad9273a7a9c694167273f9f60bbedb113a
