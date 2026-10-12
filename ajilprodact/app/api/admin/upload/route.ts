// app/api/admin/upload/route.ts
// آپلود تصویر محصول با بهینه‌سازی خودکار

import { NextResponse, type NextRequest } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { getCurrentUserId } from '@/lib/auth/session';

// ==========================================
// تنظیمات
// ==========================================

// حداکثر حجم فایل (5 مگابایت)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// فرمت‌های مجاز
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
];

// پوشه ذخیره‌سازی (نسبی به public)
const UPLOAD_DIR = 'images/products';

// ابعاد خروجی
const OUTPUT_SIZE = 1200;

// کیفیت WebP
const WEBP_QUALITY = 82;

// ==========================================
// POST: دریافت فایل
// ==========================================

export async function POST(request: NextRequest) {
  // چک احراز هویت ادمین
  const adminId = await getCurrentUserId();
  if (!adminId) {
    return NextResponse.json(
      { ok: false, error: 'دسترسی غیرمجاز' },
      { status: 401 }
    );
  }

  try {
    // خواندن formData
    const formData = await request.formData();
    const file = formData.get('file');

    // بررسی وجود فایل
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: 'فایلی ارسال نشده است' },
        { status: 400 }
      );
    }

    // بررسی حجم
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          ok: false,
          error: 'حجم فایل بیش از 5 مگابایت است',
        },
        { status: 400 }
      );
    }

    // بررسی نوع
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'فرمت فایل مجاز نیست. فقط JPG، PNG، WebP و AVIF',
        },
        { status: 400 }
      );
    }

    // خواندن محتوای فایل
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ==========================================
    // پردازش تصویر با sharp
    // ==========================================
    let processedBuffer: Buffer;
    try {
      processedBuffer = await sharp(buffer)
        // چرخش خودکار بر اساس EXIF
        .rotate()
        // تغییر اندازه: داخل 1200x1200 بدون بالابردن
        .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        // تبدیل به WebP
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'فایل تصویری معتبر نیست' },
        { status: 400 }
      );
    }

    // ==========================================
    // ذخیره فایل
    // ==========================================

    // مسیر پوشه روی دیسک
    const uploadPath = path.join(process.cwd(), 'public', UPLOAD_DIR);

    // ساخت پوشه اگر وجود ندارد
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true });
    }

    // تولید نام یکتا
    // فرمت: p-YEAR-MONTH-DAY-RANDOM.webp
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = randomBytes(6).toString('hex');
    const filename = `p-${year}${month}${day}-${random}.webp`;

    // مسیر کامل فایل
    const filePath = path.join(uploadPath, filename);

    // نوشتن روی دیسک
    await writeFile(filePath, processedBuffer);

    // URL عمومی
    const url = `/${UPLOAD_DIR}/${filename}`;

    return NextResponse.json({
      ok: true,
      url,
      size: processedBuffer.length,
      originalSize: file.size,
    });
  } catch (err) {
    console.error('خطا در آپلود:', err);
    return NextResponse.json(
      { ok: false, error: 'خطا در آپلود تصویر' },
      { status: 500 }
    );
  }
}