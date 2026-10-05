// hooks/useOtpCountdown.ts
// hook شمارش معکوس برای OTP

'use client';

import { useState, useEffect, useCallback } from 'react';

export function useOtpCountdown(initialSeconds = 0) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive || remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining((c) => {
        if (c <= 1) {
          setIsActive(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, remaining]);

  const start = useCallback((seconds: number) => {
    setRemaining(seconds);
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
    setRemaining(0);
  }, []);

  return {
    remaining,
    isActive,
    start,
    stop,
    canResend: !isActive && remaining === 0,
  };
}