// app/admin/(auth)/layout.tsx
// لایوت مخصوص صفحات احراز هویت ادمین (login، فراموشی رمز و ...)
// بدون سایدبار، بدون هدر، بدون چک لاگین

import type { ReactNode } from "react";

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf7f2] via-[#f5ede0] to-[#efe3d0] p-4">
      {children}
    </div>
  );
}