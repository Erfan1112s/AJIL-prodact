// components/Footer.tsx
// پانویس سایت با اطلاعات تماس و لینک‌ها

import Link from 'next/link';
import {
  PhoneIcon,
  MapPinIcon,
  ShieldIcon,
  TruckIcon,
  LeafIcon,
} from '@/components/icons';

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink-900 text-ink-200">
      {/* نوار مزایا */}
      <div className="border-b border-ink-800">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Feature
              icon={<TruckIcon className="w-6 h-6" />}
              title="ارسال سریع"
              desc="به سراسر کشور"
            />
            <Feature
              icon={<ShieldIcon className="w-6 h-6" />}
              title="پرداخت امن"
              desc="درگاه معتبر"
            />
            <Feature
              icon={<LeafIcon className="w-6 h-6" />}
              title="تضمین تازگی"
              desc="شناسنامه بچ"
            />
            <Feature
              icon={<PhoneIcon className="w-6 h-6" />}
              title="پشتیبانی"
              desc="۹ صبح تا ۹ شب"
            />
          </div>
        </div>
      </div>

      {/* محتوای اصلی */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* معرفی */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-lg font-bold">
                آ
              </div>
              <span className="font-bold text-white text-lg">
                آجیل و خشکبار
              </span>
            </div>
            <p className="text-sm leading-7 text-ink-400 max-w-md">
              فروشگاه آنلاین آجیل و خشکبار با تأمین مستقیم از باغات.
              تمام محصولات دارای شناسنامه بچ و امتیاز تازگی هستند.
            </p>
          </div>

          {/* لینک‌ها */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">
              دسترسی سریع
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products"
                  className="text-ink-400 hover:text-brand-400 transition-colors"
                >
                  همه محصولات
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-ink-400 hover:text-brand-400 transition-colors"
                >
                  دسته‌بندی‌ها
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-ink-400 hover:text-brand-400 transition-colors"
                >
                  درباره ما
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-ink-400 hover:text-brand-400 transition-colors"
                >
                  تماس با ما
                </Link>
              </li>
            </ul>
          </div>

          {/* تماس */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">
              تماس
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <PhoneIcon className="w-4 h-4 mt-0.5 shrink-0 text-brand-400" />
                <span className="text-ink-400 fa-num">
                  ۰۲۱-۸۸۷۷۶۶۵۵
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0 text-brand-400" />
                <span className="text-ink-400 leading-6">
                  تهران، خیابان ولیعصر، پلاک ۱۲۰۰
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* کپی‌رایت */}
        <div className="border-t border-ink-800 mt-10 pt-6 text-center text-xs text-ink-500">
          © ۱۴۰۴ آجیل و خشکبار — تمامی حقوق محفوظ است
        </div>
      </div>
    </footer>
  );
}

// کامپوننت کمکی برای نمایش هر ویژگی
function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-brand-900/40 border border-brand-800/40 flex items-center justify-center text-brand-400 shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-white text-sm font-medium">{title}</div>
        <div className="text-ink-500 text-xs mt-0.5">{desc}</div>
      </div>
    </div>
  );
}