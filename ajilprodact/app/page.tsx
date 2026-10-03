// app/page.tsx
// صفحه اصلی با Hero طلایی

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
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(4),
    getCategoryTree(),
  ]);

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gold-50 via-cream-50 to-cream-50">
        <div className="absolute inset-0 bg-dotted-gold opacity-70" aria-hidden="true" />

        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gold-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute top-20 -left-32 w-80 h-80 rounded-full bg-coffee-200/30 blur-3xl"
          aria-hidden="true"
        />

        <Container className="relative py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gold-300 text-gold-700 text-xs font-medium mb-6 shadow-sm animate-fade-in">
              <LeafIcon className="w-3.5 h-3.5" />
              تأمین مستقیم از باغات — تضمین تازگی
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-coffee-900 mb-5 leading-tight animate-fade-up">
              آجیل و خشکبار
              <span className="text-gradient-gold"> داغ و تازه</span>
              <br />
              مستقیم از باغ به سفره شما
            </h1>

            <p className="text-coffee-600 text-base sm:text-lg leading-8 mb-8 max-w-xl mx-auto animate-fade-up">
              با شناسنامه بچ و امتیاز تازگی، می‌دانید دقیقاً چه چیزی
              می‌خرید. خرید آنلاین یا حضوری از شعبه — هر جا که راحت‌ترید.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-up">
              <Link
                href="/products"
                className="group inline-flex items-center gap-2 btn-gold shimmer-line px-7 py-3.5 rounded-xl"
              >
                مشاهده محصولات
                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/categories"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white border border-coffee-200 text-coffee-800 font-medium hover:border-gold-500 hover:text-gold-700 transition-colors"
              >
                دسته‌بندی‌ها
              </Link>
            </div>

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

      {/* دسته‌بندی‌ها */}
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
                className="group relative p-5 rounded-2xl bg-gradient-to-br from-white to-gold-50/50 border border-coffee-200 hover:border-gold-400 transition-all card-warm"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-coffee-900 flex items-center justify-center mb-3 text-xl font-bold shadow-lg shadow-gold-500/20">
                  {cat.name.charAt(0)}
                </div>
                <h3 className="font-bold text-coffee-900 mb-1 group-hover:text-gold-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-coffee-500 fa-num">
                  {cat.children.length > 0
                    ? `${cat.children.length.toLocaleString('fa-IR')} زیردسته`
                    : 'مشاهده محصولات'}
                </p>
                <ArrowLeftIcon className="absolute top-5 left-5 w-4 h-4 text-coffee-300 group-hover:text-gold-600 group-hover:-translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* محصولات منتخب */}
      <section className="py-14 bg-cream-100/60">
        <Container>
          <SectionHeader
            title="محصولات منتخب"
            desc="انتخاب‌شده توسط مشتریان وفادار"
            href="/products"
            linkText="همه محصولات"
          />

          {featured.length === 0 ? (
            <p className="text-center text-coffee-500 py-12">
              هنوز محصولی ثبت نشده است.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8">
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

      {/* NFC */}
      <section className="py-14">
        <Container>
          <div className="rounded-3xl bg-gradient-to-br from-coffee-800 to-coffee-900 text-cream-100 p-8 sm:p-12 overflow-hidden relative border border-gold-700/30">
            <div
              className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-gold-500/15 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-200 text-xs mb-4">
                به‌زودی
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-cream-50">
                شناسنامه دیجیتال روی هر بسته
              </h2>
              <p className="text-cream-200/85 leading-7">
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

function HeroStat({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-coffee-700">
      <div className="w-11 h-11 rounded-xl bg-white border border-gold-200 shadow-sm flex items-center justify-center text-gold-600">
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
        <h2 className="text-xl sm:text-2xl font-bold text-coffee-900">
          {title}
        </h2>
        {desc && (
          <p className="text-sm text-coffee-500 mt-1.5">{desc}</p>
        )}
      </div>
      <Link
        href={href}
        className="group hidden sm:inline-flex items-center gap-1 text-sm text-gold-700 font-medium hover:text-gold-800 shrink-0"
      >
        {linkText}
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}