// scripts/test-sms.mjs
// تست ارسال پیامک با SMS.ir
// استفاده: node scripts/test-sms.mjs 09123456789

import { readFileSync } from 'node:fs';

// ==========================================
// ۱. خواندن .env.local
// ==========================================
try {
  const envContent = readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    // نادیده گرفتن خطوط خالی و کامنت
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // جداسازی کلید و مقدار
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    process.env[key] = value;
  }
} catch {
  console.error('فایل .env.local پیدا نشد');
  process.exit(1);
}

// ==========================================
// ۲. خواندن شماره از خط فرمان
// ==========================================
const phone = process.argv[2];
if (!phone) {
  console.error('استفاده: node scripts/test-sms.mjs 09123456789');
  process.exit(1);
}

if (!/^09\d{9}$/.test(phone)) {
  console.error('شماره باید با فرمت 09xxxxxxxxx باشد');
  process.exit(1);
}

// ==========================================
// ۳. بررسی تنظیمات
// ==========================================
const apiKey = process.env.SMSIR_API_KEY;
const templateId = process.env.SMSIR_TEMPLATE_ID;

if (!apiKey) {
  console.error('SMSIR_API_KEY در .env.local تنظیم نشده');
  process.exit(1);
}

if (!templateId) {
  console.error('SMSIR_TEMPLATE_ID در .env.local تنظیم نشده');
  process.exit(1);
}

console.log('=== تنظیمات ===');
console.log('شماره:', phone);
console.log('Template ID:', templateId);
console.log(
  'API Key:',
  apiKey.slice(0, 8) + '...' + apiKey.slice(-4)
);
console.log('');

// ==========================================
// ۴. ارسال درخواست
// ==========================================
// کد ثابت 123456 برای تست
const code = '123456';

console.log('در حال ارسال پیامک با کد', code, '...');

try {
  const response = await fetch(
    'https://api.sms.ir/v1/send/verify',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        mobile: phone,
        templateId: Number(templateId),
        parameters: [
          {
            name: 'CODE',
            value: code,
          },
        ],
      }),
    }
  );

  console.log('');
  console.log('=== پاسخ SMS.ir ===');
  console.log('HTTP Status:', response.status);

  const text = await response.text();
  console.log('متن پاسخ:', text);

  // تلاش برای پارس JSON
  try {
    const data = JSON.parse(text);
    console.log('');
    console.log('پاسخ JSON:');
    console.log(JSON.stringify(data, null, 2));

    if (data.status === 1) {
      console.log('');
      console.log('=== موفق ===');
      console.log('پیامک با موفقیت ارسال شد');
      console.log('Message ID:', data.data?.messageId);
      console.log('هزینه:', data.data?.cost, 'ریال');
    } else {
      console.log('');
      console.log('=== خطا ===');
      console.log('پیام:', data.message);
    }
  } catch {
    console.log('پاسخ JSON نبود');
  }
} catch (err) {
  console.error('');
  console.error('=== خطای شبکه ===');
  console.error(err);
}