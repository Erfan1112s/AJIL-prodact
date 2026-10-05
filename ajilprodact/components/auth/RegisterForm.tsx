// components/auth/RegisterForm.tsx
// فرم ثبت‌نام سه مرحله‌ای

'use client';

import { useState, useTransition, useRef } from 'react';
import AuthFormHeader from '@/components/auth/AuthFormHeader';
import StepDots from '@/components/auth/StepDots';
import FormField from '@/components/auth/FormField';
import PasswordField from '@/components/auth/PasswordField';
import PhoneInput from '@/components/auth/PhoneInput';
import OtpInput from '@/components/auth/OtpInput';
import CountdownText from '@/components/auth/CountdownText';
import Alert from '@/components/auth/Alert';
import SubmitButton from '@/components/auth/SubmitButton';
import { useOtpCountdown } from '@/hooks/useOtpCountdown';
import {
  validatePhone,
  validateOtp,
  validateFullName,
  validatePassword,
} from '@/lib/auth/validators';
import {
  requestRegisterOtpAction,
  verifyRegisterOtpAction,
  completeRegisterAction,
} from '@/app/auth/actions';

type Step = 'phone' | 'verify' | 'details';

const STEP_NUMBERS: Record<Step, number> = {
  phone: 1,
  verify: 2,
  details: 3,
};

export default function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const countdown = useOtpCountdown();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fullNameRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // مرحله 1
  // ==========================================
  function handleRequestOtp() {
    setFormError(null);
    setPhoneError(null);

    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }

    const fd = new FormData();
    fd.set('phone', phone);

    startTransition(async () => {
      try {
        const result = await requestRegisterOtpAction(fd);
        if (result.ok) {
          setStep('verify');
          setCode('');
          countdown.start(120);
        } else {
          setFormError(result.error);
        }
      } catch (err) {
        console.error(err);
        setFormError('خطای غیرمنتظره. لطفاً دوباره تلاش کنید.');
      }
    });
  }

  // ==========================================
  // مرحله 2
  // ==========================================
  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setCodeError(null);

    const codeErr = validateOtp(code);
    if (codeErr) {
      setCodeError(codeErr);
      return;
    }

    const fd = new FormData();
    fd.set('phone', phone);
    fd.set('code', code);

    startTransition(async () => {
      try {
        const result = await verifyRegisterOtpAction(fd);
        if (result.ok) {
          setStep('details');
          setTimeout(() => fullNameRef.current?.focus(), 50);
        } else {
          setCodeError(result.error);
          setCode('');
        }
      } catch (err) {
        console.error(err);
        setFormError('خطای غیرمنتظره. لطفاً دوباره تلاش کنید.');
      }
    });
  }

  // ==========================================
  // مرحله 3
  // ==========================================
  function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFullNameError(null);
    setPasswordError(null);

    const nameErr = validateFullName(fullName);
    const pwErr = validatePassword(password);

    setFullNameError(nameErr);
    setPasswordError(pwErr);
    if (nameErr || pwErr) return;

    const fd = new FormData();
    fd.set('phone', phone);
    fd.set('fullName', fullName);
    fd.set('password', password);

    startTransition(async () => {
      try {
        const result = await completeRegisterAction(fd);

        if (result.ok) {
          // ریدایرکت سخت - تضمینی
          window.location.href = '/profile';
        } else {
          setFormError(result.error);
        }
      } catch (err) {
        console.error(err);
        setFormError('خطای غیرمنتظره. لطفاً دوباره تلاش کنید.');
      }
    });
  }

  function goBack() {
    setFormError(null);
    if (step === 'verify') {
      setStep('phone');
      setCode('');
      countdown.stop();
    } else if (step === 'details') {
      setStep('verify');
    }
  }

  const stepNumber = STEP_NUMBERS[step];

  return (
    <div className="space-y-6">
      <StepDots current={stepNumber} total={3} />

      {/* مرحله 1 */}
      {step === 'phone' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRequestOtp();
          }}
          className="space-y-5 animate-fade-up"
        >
          <AuthFormHeader
            title="شماره موبایل خود را وارد کنید"
            desc="برای دریافت کد تایید، شماره خود را وارد کنید."
          />

          <PhoneInput
            value={phone}
            onChange={setPhone}
            disabled={isPending}
            autoFocus
            error={phoneError}
          />

          {formError && <Alert type="error">{formError}</Alert>}

          <SubmitButton loading={isPending}>دریافت کد تایید</SubmitButton>
        </form>
      )}

      {/* مرحله 2 */}
      {step === 'verify' && (
        <form
          onSubmit={handleVerifyOtp}
          className="space-y-5 animate-fade-up"
        >
          <AuthFormHeader
            title="کد تایید را وارد کنید"
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
            onChange={setCode}
            disabled={isPending}
            error={Boolean(codeError)}
          />

          {codeError && <Alert type="error">{codeError}</Alert>}

          <div className="text-center">
            <CountdownText
              remaining={countdown.remaining}
              canResend={countdown.canResend}
              onResend={handleRequestOtp}
              disabled={isPending}
            />
          </div>

          <SubmitButton loading={isPending}>تایید کد</SubmitButton>

          <button
            type="button"
            onClick={goBack}
            disabled={isPending}
            className="block mx-auto text-xs text-coffee-500 hover:text-coffee-800 disabled:opacity-50 transition-colors"
          >
            تغییر شماره موبایل
          </button>
        </form>
      )}

      {/* مرحله 3 */}
      {step === 'details' && (
        <form
          onSubmit={handleComplete}
          className="space-y-5 animate-fade-up"
          noValidate
        >
          <AuthFormHeader
            title="تکمیل اطلاعات حساب"
            desc="اطلاعات زیر برای ساخت حساب شما لازم است."
          />

          <Alert type="success" title="شماره موبایل تایید شد">
            <span className="fa-num" dir="ltr">
              {phone}
            </span>
          </Alert>

          <FormField
            ref={fullNameRef}
            label="نام و نام خانوادگی"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="مثال: علی رضایی"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fullNameError) setFullNameError(null);
            }}
            disabled={isPending}
            error={fullNameError}
          />

          <PasswordField
            value={password}
            onChange={(value) => {
              setPassword(value);
              if (passwordError) setPasswordError(null);
            }}
            disabled={isPending}
            error={passwordError}
            showStrength
          />

          {formError && <Alert type="error">{formError}</Alert>}

          <SubmitButton loading={isPending}>ساخت حساب</SubmitButton>

          <button
            type="button"
            onClick={goBack}
            disabled={isPending}
            className="block mx-auto text-xs text-coffee-500 hover:text-coffee-800 disabled:opacity-50 transition-colors"
          >
            بازگشت به مرحله قبل
          </button>
        </form>
      )}
    </div>
  );
}