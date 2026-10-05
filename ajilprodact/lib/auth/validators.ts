// lib/auth/validators.ts
// اعتبارسنجی‌های مشترک احراز هویت

// ==========================================
// شماره موبایل
// ==========================================

export const PHONE_REGEX = /^09\d{9}$/;

export function validatePhone(phone: string): string | null {
  const clean = phone.replace(/\D/g, '');
  if (!clean) return 'شماره موبایل را وارد کنید';
  if (clean.length !== 11) return 'شماره موبایل باید 11 رقم باشد';
  if (!clean.startsWith('09')) return 'شماره باید با 09 شروع شود';
  return null;
}

// ==========================================
// کد OTP
// ==========================================

export const OTP_LENGTH = 6;

export function validateOtp(code: string): string | null {
  if (!code) return 'کد تایید را وارد کنید';
  if (!/^\d+$/.test(code)) return 'کد فقط می‌تواند عدد باشد';
  if (code.length !== OTP_LENGTH) {
    return `کد باید ${OTP_LENGTH} رقم باشد`;
  }
  return null;
}

// ==========================================
// نام و نام خانوادگی
// ==========================================

export function validateFullName(name: string): string | null {
  const clean = name.trim();
  if (!clean) return 'نام و نام خانوادگی را وارد کنید';
  if (clean.length < 3) return 'نام باید حداقل 3 کاراکتر باشد';
  if (clean.length > 100) return 'نام نمی‌تواند بیش از 100 کاراکتر باشد';
  return null;
}

// ==========================================
// رمز عبور
// ==========================================

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 200;

export function validatePassword(password: string): string | null {
  if (!password) return 'رمز عبور را وارد کنید';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `رمز عبور باید حداقل ${PASSWORD_MIN_LENGTH} کاراکتر باشد`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `رمز عبور نمی‌تواند بیش از ${PASSWORD_MAX_LENGTH} کاراکتر باشد`;
  }
  return null;
}

// ==========================================
// قدرت رمز عبور
// ==========================================

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;

  const safe = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;

  const map: Record<typeof safe, { label: string; color: string }> = {
    0: { label: '', color: '' },
    1: { label: 'ضعیف', color: 'bg-red-400' },
    2: { label: 'متوسط', color: 'bg-gold-400' },
    3: { label: 'خوب', color: 'bg-brand-400' },
    4: { label: 'قوی', color: 'bg-brand-600' },
  };

  return { score: safe, ...map[safe] };
}