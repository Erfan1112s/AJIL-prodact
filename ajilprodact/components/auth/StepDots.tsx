// components/auth/StepDots.tsx
// نشانگر مرحله‌ها در فرم‌های چند مرحله‌ای

interface Props {
  current: number; // 1-based
  total: number;
}

export default function StepDots({ current, total }: Props) {
  return (
    <div
      className="flex items-center justify-center gap-3 mb-6"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`مرحله ${current} از ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;

        return (
          <div key={i} className="flex items-center gap-3">
            {/* دایره */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                done
                  ? 'bg-gold-500 text-coffee-900 shadow-md shadow-gold-500/30'
                  : active
                    ? 'bg-gold-100 text-gold-700 ring-2 ring-gold-500'
                    : 'bg-cream-100 text-coffee-400'
              }`}
            >
              {done ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="fa-num">{step.toLocaleString('fa-IR')}</span>
              )}
            </div>

            {/* خط اتصال */}
            {i < total - 1 && (
              <div
                className={`w-10 h-0.5 rounded-full transition-colors duration-300 ${
                  step < current ? 'bg-gold-500' : 'bg-cream-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}