// app/api/reviews/upload/route.ts
// آپلود عکس و ویدیو برای نظرات

import { NextResponse, type NextRequest } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const UPLOAD_DIR = 'uploads/reviews';
const IMAGE_MAX_DIM = 1600;
const IMAGE_QUALITY = 82;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;

const uploadHistory = new Map<number, number[]>();

function checkRateLimit(customerId: number): boolean {
  const now = Date.now();
  const history = uploadHistory.get(customerId) ?? [];
  const recent = history.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) return false;

  recent.push(now);
  uploadHistory.set(customerId, recent);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // ۱. احراز هویت
    const customerId = await getCurrentCustomerId();
    if (!customerId) {
      return NextResponse.json(
        { ok: false, error: 'برای آپلود فایل باید وارد حساب خود شوید' },
        { status: 401 }
      );
    }

    // ۲. Rate limit
    if (!checkRateLimit(customerId)) {
      return NextResponse.json(
        { ok: false, error: 'تعداد درخواست‌ها بیش از حد مجاز' },
        { status: 429 }
      );
    }

    // ۳. formData
    const formData = await request.formData();
    const file = formData.get('file');
    const mediaTypeRaw = formData.get('media_type');
    const mediaType = mediaTypeRaw === 'VIDEO' ? 'VIDEO' : 'IMAGE';

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: 'فایلی ارسال نشده است' },
        { status: 400 }
      );
    }

    // ۴. اعتبارسنجی
    const isImage = mediaType === 'IMAGE';
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    const allowedTypes = isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          ok: false,
          error: isImage
            ? 'حجم عکس نباید از ۵ مگابایت بیشتر باشد'
            : 'حجم ویدیو نباید از ۵۰ مگابایت بیشتر باشد',
        },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error: isImage
            ? 'فرمت عکس مجاز نیست. فقط JPG، PNG، WebP و AVIF'
            : 'فرمت ویدیو مجاز نیست. فقط MP4، WebM و MOV',
        },
        { status: 400 }
      );
    }

    // ۵. خواندن فایل
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ۶. ساخت پوشه
    const uploadPath = path.join(process.cwd(), 'public', UPLOAD_DIR);

    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true });
    }

    // ۷. نام یکتا
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = randomBytes(8).toString('hex');

    if (isImage) {
      let processedBuffer: Buffer;

      try {
        processedBuffer = await sharp(buffer)
          .rotate()
          .resize(IMAGE_MAX_DIM, IMAGE_MAX_DIM, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: IMAGE_QUALITY })
          .toBuffer();
      } catch (sharpErr) {
        console.error('Sharp error:', sharpErr);
        return NextResponse.json(
          { ok: false, error: 'فایل تصویری معتبر نیست' },
          { status: 400 }
        );
      }

      const filename = `r-${year}${month}-${random}.webp`;
      const filePath = path.join(uploadPath, filename);
      await writeFile(filePath, processedBuffer);

      return NextResponse.json({
        ok: true,
        url: `/${UPLOAD_DIR}/${filename}`,
        thumbnail_url: null,
      });
    } else {
      const ext =
        file.type === 'video/mp4'
          ? 'mp4'
          : file.type === 'video/webm'
            ? 'webm'
            : 'mov';

      const filename = `r-${year}${month}-${random}.${ext}`;
      const filePath = path.join(uploadPath, filename);
      await writeFile(filePath, buffer);

      return NextResponse.json({
        ok: true,
        url: `/${UPLOAD_DIR}/${filename}`,
        thumbnail_url: null,
      });
    }
  } catch (err) {
    // مهم: خطای کامل در ترمینال چاپ می‌شود
    console.error('=== UPLOAD ERROR ===');
    console.error(err);
    console.error('===================');

    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'خطا در آپلود',
      },
      { status: 500 }
    );
  }
}