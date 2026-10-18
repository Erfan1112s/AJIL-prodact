// components/Footer.tsx
// پانویس سایت با پالت قهوه‌ای و طلایی

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
    <footer className="mt-20 bg-coffee-900 text-coffee-300" aria-label="پاورقی سایت">
      <div className="border-b border-coffee-800/90">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Feature
              icon={<TruckIcon className="h-6 w-6" />}
              title="ارسال سریع"
              desc="به سراسر کشور"
            />
            <Feature
              icon={<ShieldIcon className="h-6 w-6" />}
              title="پرداخت امن"
              desc="درگاه معتبر"
            />
            <Feature
              icon={<LeafIcon className="h-6 w-6" />}
              title="تضمین تازگی"
              desc="شناسنامه بچ"
            />
            <Feature
              icon={<PhoneIcon className="h-6 w-6" />}
              title="پشتیبانی"
              desc="۹ صبح تا ۹ شب"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 text-lg font-black text-coffee-900 shadow-[0_8px_18px_rgba(245,158,11,0.25)]">
                آ
              </div>
              <span className="text-lg font-black text-cream-50">
                آجیل و خشکبار
              </span>
            </div>

            <p className="max-w-lg text-sm leading-7 text-coffee-400">
              فروشگاه آنلاین آجیل و خشکبار با تأمین مستقیم از باغات و شعبه‌های
              منتخب. محصولات ما با رعایت استانداردهای تازه‌سازی و شناسنامه
              کامل، تجربه‌ای مطمئن برای مشتریان فراهم می‌کنند.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-gold-400">
              دسترسی سریع
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products"
                  className="text-coffee-400 transition-colors hover:text-gold-400"
                >
                  همه محصولات
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-coffee-400 transition-colors hover:text-gold-400"
                >
                  دسته‌بندی‌ها
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-coffee-400 transition-colors hover:text-gold-400"
                >
                  درباره ما
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-coffee-400 transition-colors hover:text-gold-400"
                >
                  تماس با ما
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-gold-400">
              تماس
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                <a
                  href="tel:02188776655"
                  className="fa-num text-coffee-400 transition-colors hover:text-gold-400"
                >
                  ۰۲۱-۸۸۷۷۶۶۵۵
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                <span className="leading-6 text-coffee-400">
                  تهران، خیابان ولیعصر، پلاک ۱۲۰۰
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="divider-gold mt-10 mb-6 opacity-30" />

        <div className="text-center text-xs text-coffee-500">
          © ۱۴۰۴ آجیل و خشکبار — تمامی حقوق محفوظ است
        </div>
      </div>
    </footer>
  );
}

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
    <div className="flex items-start gap-3 rounded-2xl border border-coffee-700/50 bg-coffee-800/60 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-700/30 bg-coffee-900 text-gold-400">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold text-cream-100">{title}</div>
        <div className="mt-0.5 text-[11px] text-coffee-500">{desc}</div>
      </div>
    </div>
  );
}