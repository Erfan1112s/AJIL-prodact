// app/page.tsx
// صفحه اصلی با Hero چشم‌گیر و بخش‌های منظم

import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/queries/products';
import { getCategoryTree } from '@/lib/queries/categories';
import ProductCard from '@/components/ProductCard';
import Container from '@/components/Container';
import {
  ArrowLeftIcon,
  LeafIcon,
  ShieldIcon,
  TruckIcon,
} from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // داده‌ها به صورت موازی
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(4),
    getCategoryTree(),
  ]);

  return (
    <main className="min-h-screen">
      {/* ==========================================
          بخش Hero
          ========================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        {/* پس‌زمینه نقطه‌ای */}
        <div className="absolute inset-0 bg-dotted opacity-60" aria-hidden="true" />

        {/* دایره‌های رنگی تزئینی */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute top-20 -left-32 w-80 h-80 rounded-full bg-accent-400/20 blur-3xl"
          aria-hidden="true"
        />

        <Container className="relative py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center">
            {/* نشان کوچک */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-brand-200 text-brand-700 text-xs font-medium mb-6 shadow-sm animate-fade-in">
              <LeafIcon className="w-3.5 h-3.5" />
              تأمین مستقیم از باغات — تضمین تازگی
            </div>

            {/* عنوان اصلی */}
            <h1 className="text-4xl sm:text-5xl font-bold text-ink-900 mb-5 leading-tight animate-fade-up">
              آجیل و خشکبار
              <span className="text-gradient"> تازه و اصل</span>
              <br />
              مستقیم از باغ به سفره شما
            </h1>

            {/* توضیح */}
            <p className="text-ink-600 text-base sm:text-lg leading-8 mb-8 max-w-xl mx-auto animate-fade-up">
              با شناسنامه بچ و امتیاز تازگی، می‌دانید دقیقاً چه چیزی
              می‌خرید. خرید آنلاین یا حضوری از شعبه — هر جا که راحت‌ترید.
            </p>

            {/* دکمه‌ها */}
            <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-up">
              <Link
                href="/products"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 hover:shadow-xl hover:shadow-brand-600/30"
              >
                مشاهده محصولات
                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/categories"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-ink-200 text-ink-800 font-medium hover:border-brand-500 hover:text-brand-700 transition-colors"
              >
                دسته‌بندی‌ها
              </Link>
            </div>

            {/* مزایا */}
            <div className="grid grid-cols-3 gap-4 mt-14 max-w-lg mx-auto animate-fade-in">
              <HeroStat
                icon={<ShieldIcon className="w-5 h-5" />}
                label="تضمین کیفیت"
              />
              <HeroStat
                icon={<TruckIcon className="w-5 h-5" />}
                label="ارسال سریع"
              />
              <HeroStat
                icon={<LeafIcon className="w-5 h-5" />}
                label="تازه و طبیعی"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* ==========================================
          بخش دسته‌بندی‌ها
          ========================================== */}
      <section className="py-14">
        <Container>
          <SectionHeader
            title="خرید بر اساس دسته"
            desc="محصولات خود را از دسته‌بندی‌های متنوع انتخاب کنید"
            href="/categories"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group relative p-5 rounded-2xl bg-gradient-to-br from-white to-brand-50/50 border border-ink-200 hover:border-brand-300 transition-all card-soft"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center mb-3 text-xl font-bold">
                  {cat.name.charAt(0)}
                </div>
                <h3 className="font-bold text-ink-900 mb-1 group-hover:text-brand-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-ink-500">
                  {cat.children.length > 0
                    ? `${cat.children.length} زیردسته`
                    : 'مشاهده محصولات'}
                </p>
                <ArrowLeftIcon className="absolute top-5 left-5 w-4 h-4 text-ink-300 group-hover:text-brand-600 group-hover:-translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ==========================================
          بخش محصولات منتخب
          ========================================== */}
      <section className="py-14 bg-ink-50/50">
        <Container>
          <SectionHeader
            title="محصولات منتخب"
            desc="انتخاب‌شده توسط مشتریان وفادار"
            href="/products"
            linkText="همه محصولات"
          />

          {featured.length === 0 ? (
            <p className="text-center text-ink-500 py-12">
              هنوز محصولی ثبت نشده است.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {featured.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ==========================================
          بخش NFC (پیش‌نمایش فاز بعدی)
          ========================================== */}
      <section className="py-14">
        <Container>
          <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-8 sm:p-12 overflow-hidden relative">
            <div
              className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs mb-4">
                به‌زودی
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                شناسنامه دیجیتال روی هر بسته
              </h2>
              <p className="text-white/80 leading-7">
                روی هر بسته NFC تعبیه می‌شود. با یک لمس، تاریخ برداشت،
                برشته‌کاری، بچ تولید و امتیاز تازگی را ببینید.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

// ==========================================
// کامپوننت‌های کمکی
// ==========================================

function HeroStat({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-ink-700">
      <div className="w-10 h-10 rounded-xl bg-white border border-ink-200 shadow-sm flex items-center justify-center text-brand-600">
        {icon}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function SectionHeader({
  title,
  desc,
  href,
  linkText = 'مشاهده همه',
}: {
  title: string;
  desc?: string;
  href: string;
  linkText?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-ink-900">
          {title}
        </h2>
        {desc && (
          <p className="text-sm text-ink-500 mt-1.5">{desc}</p>
        )}
      </div>
      <Link
        href={href}
        className="group hidden sm:inline-flex items-center gap-1 text-sm text-brand-700 font-medium hover:text-brand-800 shrink-0"
      >
        {linkText}
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}