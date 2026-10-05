// components/auth/RegisterForm.tsx
// فرم ثبت‌نام سه مرحله‌ای
// مرحله 1: شماره موبایل
// مرحله 2: تایید کد OTP
// مرحله 3: نام + کد ملی + رمز عبور

'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  validateNationalCode,
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const countdown = useOtpCountdown();

  // state متمرکز
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationalCode, setNationalCode] = useState('');
  const [password, setPassword] = useState('');

  // خطاها
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [nationalCodeError, setNationalCodeError] = useState<string | null>(
    null
  );
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // برای فوکوس خودکار
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
      const result = await requestRegisterOtpAction(fd);
      if (result.ok) {
        setStep('verify');
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
      const result = await verifyRegisterOtpAction(fd);
      if (result.ok) {
        setStep('details');
        setFormError(null);
        // فوکوس روی فیلد نام بعد از رندر
        setTimeout(() => fullNameRef.current?.focus(), 50);
      } else {
        setCodeError(result.error);
        setCode('');
      }
    });
  }

  // ==========================================
  // مرحله 3
  // ==========================================
  function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const nameErr = validateFullName(fullName);
    const ncErr = validateNationalCode(nationalCode);
    const pwErr = validatePassword(password);

    setFullNameError(nameErr);
    setNationalCodeError(ncErr);
    setPasswordError(pwErr);

    if (nameErr || ncErr || pwErr) return;

    const fd = new FormData();
    fd.set('phone', phone);
    fd.set('fullName', fullName);
    fd.set('nationalCode', nationalCode);
    fd.set('password', password);

    startTransition(async () => {
      const result = await completeRegisterAction(fd);
      if (result.ok) {
        router.push('/profile');
        router.refresh();
      } else {
        setFormError(result.error);
        // اگر خطا مربوط به کد ملی است، آن را کنار فیلد نشان بده
        if (result.code === 'INVALID_NATIONAL') {
          setNationalCodeError(result.error);
          setFormError(null);
        } else if (result.code === 'NATIONAL_DUPLICATE') {
          setNationalCodeError(result.error);
          setFormError(null);
        }
      }
    });
  }

  // ==========================================
  // بازگشت به مرحله قبل
  // ==========================================
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

  // ==========================================
  // رندر
  // ==========================================

  const stepNumber = STEP_NUMBERS[step];

  return (
    <div className="space-y-6">
      {/* نشانگر مرحله */}
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

          <SubmitButton loading={isPending} disabled={phone.length !== 11}>
            دریافت کد تایید
          </SubmitButton>
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

          {codeError && (
            <Alert type="error">{codeError}</Alert>
          )}

          <div className="text-center">
            <CountdownText
              remaining={countdown.remaining}
              canResend={countdown.canResend}
              onResend={handleRequestOtp}
              disabled={isPending}
            />
          </div>

          <SubmitButton
            loading={isPending}
            disabled={code.length !== 6}
          >
            تایید کد
          </SubmitButton>

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
        >
          <AuthFormHeader
            title="تکمیل اطلاعات حساب"
            desc="اطلاعات زیر برای ساخت حساب شما لازم است."
          />

          {/* نشان تایید شماره */}
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

          <FormField
            label="کد ملی"
            name="nationalCode"
            type="text"
            inputMode="numeric"
            dir="ltr"
            placeholder="1234567890"
            value={nationalCode}
            onChange={(e) => {
              setNationalCode(
                e.target.value.replace(/\D/g, '').slice(0, 10)
              );
              if (nationalCodeError) setNationalCodeError(null);
            }}
            disabled={isPending}
            centered
            faNumeric
            error={nationalCodeError}
            hint="کد ملی باید متعلق به صاحب شماره موبایل بالا باشد."
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

          {/* هشدار امنیتی */}
          <Alert type="info" title="توجه">
            کد ملی وارد شده باید با نام صاحب شماره موبایل مطابقت داشته
            باشد. این برای جلوگیری از سوءاستفاده است.
          </Alert>

          <SubmitButton
            loading={isPending}
            disabled={
              fullName.length < 3 ||
              nationalCode.length !== 10 ||
              password.length < 8
            }
          >
            ساخت حساب
          </SubmitButton>

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