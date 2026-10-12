// components/admin/SalesChart.tsx
// نمودار فروش ۷ روز اخیر با SVG دستی

import type { SalesPoint } from '@/lib/queries/dashboard';

interface Props {
  data: SalesPoint[];
}

function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

export default function SalesChart({ data }: Props) {
  if (data.length === 0) return null;

  // ابعاد نمودار
  const W = 700;
  const H = 180;
  const PAD_TOP = 20;
  const PAD_BOTTOM = 40;
  const PAD_H = 20;

  const innerW = W - PAD_H * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;

  // بیشترین مقدار برای مقیاس
  const maxValue = Math.max(...data.map((d) => d.revenue), 1);

  // محاسبه مختصات هر نقطه
  const points = data.map((d, i) => {
    const x = PAD_H + (i / (data.length - 1)) * innerW;
    const y = PAD_TOP + innerH - (d.revenue / maxValue) * innerH;
    return { x, y, ...d };
  });

  // مسیر خط
  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  // مسیر پر شده زیر خط
  const areaPath =
    `M ${PAD_H} ${PAD_TOP + innerH} ` +
    points.map((p) => `L ${p.x} ${p.y}`).join(' ') +
    ` L ${PAD_H + innerW} ${PAD_TOP + innerH} Z`;

  // آمار کلی
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.ordersCount, 0);
  const avgRevenue = Math.round(totalRevenue / data.length);

  return (
    <div className="rounded-2xl border border-coffee-200 bg-white p-5 sm:p-6">
      {/* هدر */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h3 className="text-sm font-bold text-coffee-900 mb-1">
            فروش 7 روز اخیر
          </h3>
          <p className="text-xs text-coffee-500">
            مجموع: {formatPrice(totalRevenue)} تومان
          </p>
        </div>

        {/* آمار کنار */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-[10px] text-coffee-500 mb-0.5">
              میانگین روزانه
            </div>
            <div className="text-sm font-bold text-coffee-900 fa-num">
              {formatPrice(avgRevenue)}
            </div>
          </div>
          <div className="w-px h-8 bg-coffee-100" />
          <div className="text-center">
            <div className="text-[10px] text-coffee-500 mb-0.5">
              کل سفارشات
            </div>
            <div className="text-sm font-bold text-coffee-900 fa-num">
              {totalOrders.toLocaleString('fa-IR')}
            </div>
          </div>
        </div>
      </div>

      {/* SVG نمودار */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minWidth: '500px' }}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="نمودار فروش 7 روز اخیر"
        >
          <defs>
            {/* گرادیانت زیر خط */}
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9982A" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#C9982A" stopOpacity="0.02" />
            </linearGradient>

            {/* گرادیانت خط */}
            <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8C6D1F" />
              <stop offset="50%" stopColor="#C9982A" />
              <stop offset="100%" stopColor="#E8C874" />
            </linearGradient>
          </defs>

          {/* خطوط افقی راهنما */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = PAD_TOP + ratio * innerH;
            return (
              <line
                key={ratio}
                x1={PAD_H}
                y1={y}
                x2={PAD_H + innerW}
                y2={y}
                stroke="#F0E6E0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* مسیر پر شده */}
          <path d={areaPath} fill="url(#area-gradient)" />

          {/* خط اصلی */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* نقطه‌ها و برچسب روزها */}
          {points.map((p) => (
            <g key={p.date}>
              {/* نقطه */}
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill="#FDFBF7"
                stroke="#C9982A"
                strokeWidth="2.5"
              />

              {/* مقدار بالای نقطه */}
              {p.revenue > 0 && (
                <text
                  x={p.x}
                  y={p.y - 14}
                  textAnchor="middle"
                  className="fa-num"
                  fontSize="10"
                  fontWeight="700"
                  fill="#4E342E"
                >
                  {formatPrice(p.revenue)}
                </text>
              )}

              {/* برچسب روز */}
              <text
                x={p.x}
                y={H - 15}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#A67C6A"
              >
                {p.dayLabel}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}