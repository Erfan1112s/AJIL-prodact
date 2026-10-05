// components/auth/ForgotPasswordForm.tsx
// فرم بازیابی رمز عبور: دو مرحله‌ای

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import AuthFormHeader from '@/components/auth/AuthFormHeader';
import StepDots from '@/components/auth/StepDots';
import PhoneInput from '@/components/auth/PhoneInput';
import PasswordField from '@/components/auth/PasswordField';
import OtpInput from '@/components/auth/OtpInput';
import CountdownText from '@/components/auth/CountdownText';
import Alert from '@/components/auth/Alert';
import SubmitButton from '@/components/auth/SubmitButton';
import { useOtpCountdown } from '@/hooks/useOtpCountdown';
import {
  validatePhone,
  validateOtp,
  validatePassword,
} from '@/lib/auth/validators';
import {
  requestResetOtpAction,
  resetPasswordAction,
} from '@/app/auth/actions';

type Step = 'phone' | 'reset';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const countdown = useOtpCountdown();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ==========================================
  // مرحله 1
  // ==========================================
  function handleRequestOtp() {
    setFormError(null);
    setPhoneError(null);

    const err = validatePhone(phone);
    if (err) {
      setPhoneError(err);
      return;
    }

    const fd = new FormData();
    fd.set('phone', phone);

    startTransition(async () => {
      const result = await requestResetOtpAction(fd);
      if (result.ok) {
        setStep('reset');
        setCode('');
        countdown.start(120);
      } else {
        setFormError(result.error);
      }
    });
  }

  // ==========================================
  // مرحله 2
  // ==========================================
  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const codeErr = validateOtp(code);
    const pwErr = validatePassword(password);
    setCodeError(codeErr);
    setPasswordError(pwErr);
    if (codeErr || pwErr) return;

    const fd = new FormData();
    fd.set('phone', phone);
    fd.set('code', code);
    fd.set('password', password);

    startTransition(async () => {
      const result = await resetPasswordAction(fd);
      if (result.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
          router.refresh();
        }, 1800);
      } else {
        setFormError(result.error);
      }
    });
  }

  // ==========================================
  // موفقیت
  // ==========================================
  if (success) {
    return (
      <div className="text-center py-6 animate-fade-up">
        <div className="w-16 h-16 rounded-full bg-brand-500 text-white mx-auto flex items-center justify-center mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-coffee-900 mb-2">
          رمز عبور با موفقیت تغییر کرد
        </h3>
        <p className="text-sm text-coffee-500">
          در حال انتقال به صفحه ورود...
        </p>
      </div>
    );
  }

  // ==========================================
  // مرحله 1
  // ==========================================
  if (step === 'phone') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleRequestOtp();
        }}
        className="space-y-5 animate-fade-up"
      >
        <AuthFormHeader
          title="بازیابی رمز عبور"
          desc="شماره موبایل حساب خود را وارد کنید."
        />

        <PhoneInput
          value={phone}
          onChange={(v) => {
            setPhone(v);
            if (phoneError) setPhoneError(null);
          }}
          disabled={isPending}
          autoFocus
          error={phoneError}
        />

        {formError && <Alert type="error">{formError}</Alert>}

        <SubmitButton loading={isPending} disabled={phone.length !== 11}>
          دریافت کد بازیابی
        </SubmitButton>
      </form>
    );
  }

  // ==========================================
  // مرحله 2
  // ==========================================
  return (
    <form
      onSubmit={handleReset}
      className="space-y-5 animate-fade-up"
    >
      <StepDots current={2} total={2} />

      <AuthFormHeader
        title="کد تایید و رمز جدید"
        desc={
          <>
            کد 6 رقمی به شماره{' '}
            <span className="font-bold text-coffee-900 fa-num" dir="ltr">
              {phone}
            </span>{' '}
            ارسال شد.
          </>
        }
      />

      <OtpInput
        value={code}
        onChange={(v) => {
          setCode(v);
          if (codeError) setCodeError(null);
        }}
        disabled={isPending}
        error={Boolean(codeError)}
      />

      <div className="text-center">
        <CountdownText
          remaining={countdown.remaining}
          canResend={countdown.canResend}
          onResend={handleRequestOtp}
          disabled={isPending}
        />
      </div>

      <PasswordField
        label="رمز عبور جدید"
        value={password}
        onChange={(v) => {
          setPassword(v);
          if (passwordError) setPasswordError(null);
        }}
        disabled={isPending}
        error={passwordError}
        showStrength
      />

      {formError && <Alert type="error">{formError}</Alert>}

      <SubmitButton
        loading={isPending}
        disabled={code.length !== 6 || password.length < 8}
      >
        تغییر رمز عبور
      </SubmitButton>

      <button
        type="button"
        onClick={() => {
          setStep('phone');
          setCode('');
          setFormError(null);
          countdown.stop();
        }}
        disabled={isPending}
        className="block mx-auto text-xs text-coffee-500 hover:text-coffee-800 disabled:opacity-50 transition-colors"
      >
        تغییر شماره موبایل
      </button>
    </form>
  );
}