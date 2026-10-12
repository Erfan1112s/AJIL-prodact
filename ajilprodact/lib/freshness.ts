// lib/freshness.ts
// محاسبه امتیاز تازگی محصول

import type { BatchRow } from '@/lib/types';

// ==========================================
// تنظیمات
// ==========================================

// حداقل امتیاز قابل قبول (زیر این = منقضی)
export const MIN_FRESHNESS = 0;

// حداکثر امتیاز
export const MAX_FRESHNESS = 100;

// ==========================================
// محاسبه امتیاز در حالت AUTO
// ==========================================

/**
 * محاسبه امتیاز تازگی در حالت خودکار
 *
 * فرمول:
 *   daysPassed = امروز - تاریخ پایه
 *   yearsPassed = daysPassed / 365
 *   reduction = yearsPassed * annualDecay
 *   score = baseScore - reduction
 *
 * مثال با پایه 100 و کاهش 50:
 *   - روز 0: 100
 *   - 6 ماه: 75
 *   - 1 سال: 50
 *   - 2 سال: 0
 */
export function calculateAutoFreshness(batch: {
  freshness_base_score: number;
  freshness_base_date: Date | null;
  freshness_annual_decay: number;
  pack_date?: Date | null;
}): number {
  // تاریخ پایه را تعیین کن
  const baseDate = batch.freshness_base_date ?? batch.pack_date;

  // اگر هیچ تاریخی نیست، امتیاز پایه را برگردان
  if (!baseDate) {
    return clampScore(batch.freshness_base_score);
  }

  const now = Date.now();
  const base = new Date(baseDate).getTime();

  // اگر تاریخ آینده است، امتیاز پایه
  if (base > now) {
    return clampScore(batch.freshness_base_score);
  }

  const daysPassed = (now - base) / (1000 * 60 * 60 * 24);
  const yearsPassed = daysPassed / 365;
  const reduction = yearsPassed * batch.freshness_annual_decay;

  const score = batch.freshness_base_score - reduction;

  return clampScore(Math.round(score));
}

// ==========================================
// گرفتن امتیاز فعلی
// ==========================================

/**
 * امتیاز فعلی batch را برگردان
 * - در MANUAL: مقدار ذخیره‌شده
 * - در AUTO: محاسبه لحظه‌ای
 */
export function getCurrentFreshness(batch: BatchRow): number {
  if (batch.freshness_mode === 'AUTO') {
    return calculateAutoFreshness({
      freshness_base_score: batch.freshness_base_score,
      freshness_base_date: batch.freshness_base_date,
      freshness_annual_decay: batch.freshness_annual_decay,
      pack_date: batch.pack_date,
    });
  }
  return clampScore(batch.freshness_score);
}

// ==========================================
// محدود کردن به بازه
// ==========================================

function clampScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  return Math.max(MIN_FRESHNESS, Math.min(MAX_FRESHNESS, score));
}

// ==========================================
// برچسب کیفی امتیاز
// ==========================================

export interface FreshnessLabel {
  text: string;
  color: 'green' | 'gold' | 'red';
}

export function getFreshnessLabel(score: number): FreshnessLabel {
  if (score >= 80) return { text: 'بسیار تازه', color: 'green' };
  if (score >= 60) return { text: 'تازه', color: 'green' };
  if (score >= 40) return { text: 'قابل قبول', color: 'gold' };
  if (score >= 20) return { text: 'نیاز به مصرف سریع', color: 'red' };
  return { text: 'نزدیک انقضا', color: 'red' };
}

// ==========================================
// تاریخ تقریبی انقضا بر اساس تازگی
// ==========================================

/**
 * اگر امتیاز به 0 رسید، چه تاریخی است؟
 * برای نمایش به ادمین
 */
export function estimateExpiryDate(batch: {
  freshness_base_score: number;
  freshness_base_date: Date | null;
  freshness_annual_decay: number;
  pack_date?: Date | null;
}): Date | null {
  const baseDate = batch.freshness_base_date ?? batch.pack_date;
  if (!baseDate) return null;

  // سال‌هایی که طول می‌کشد تا امتیاز به 0 برسد
  const yearsToZero = batch.freshness_base_score / batch.freshness_annual_decay;

  const expiry = new Date(baseDate);
  expiry.setDate(expiry.getDate() + Math.round(yearsToZero * 365));

  return expiry;
}