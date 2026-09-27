// app/products/[slug]/page.tsx
// صفحه تک محصول با گالری، انتخاب واریانت، شناسنامه و موجودی شعبات

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/queries/products';
import { getVariantAvailability } from '@/lib/queries/branches';
import ProductGallery from '@/components/ProductGallery';
import ProductVariantSelector from '@/components/ProductVariantSelector';
import Container from '@/components/Container';
import { LeafIcon, MapPinIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'محصول یافت نشد' };
  }

  return {
    title: product.meta_title ?? product.name,
    description:
      product.meta_desc ?? product.short_desc ?? product.name,
    openGraph: {
      title: product.name,
      description: product.short_desc ?? '',
      type: 'website',
      images: product.images.map((img) => ({
        url: img.url,
        alt: img.alt ?? product.name,
      })),
    },
    alternates: {
      canonical: `/products/${product.slug}`,
    },
  };
}

// تابع کمکی برای تاریخ شمسی
function formatDate(date: Date | null): string {
  if (!date) return 'ثبت نشده';
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // گرفتن موجودی اولین واریانت
  const firstVariant = product.variants[0];
  const branchStock = firstVariant
    ? await getVariantAvailability(firstVariant.id)
    : [];

  // آیا جایی موجود است؟
  const totalAvailable = branchStock.reduce(
    (sum, b) => sum + b.available,
    0
  );

  return (
    <main className="min-h-screen">
      {/* breadcrumb */}
      <div className="bg-ink-50 border-b border-ink-200">
        <Container className="py-3 text-sm text-ink-600">
          <Link href="/" className="hover:text-brand-700 transition-colors">
            خانه
          </Link>
          <span className="mx-2 text-ink-400">/</span>
          <Link
            href={`/categories/${product.category.slug}`}
            className="hover:text-brand-700 transition-colors"
          >
            {product.category.name}
          </Link>
          <span className="mx-2 text-ink-400">/</span>
          <span className="text-ink-900">{product.name}</span>
        </Container>
      </div>

      {/* بخش اصلی */}
      <Container className="py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* ستون چپ: گالری */}
          <ProductGallery
            images={product.images}
            productName={product.name}
          />

          {/* ستون راست: اطلاعات */}
          <div>
            {/* دسته و نشان تازگی */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Link
                href={`/categories/${product.category.slug}`}
                className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100 transition-colors"
              >
                {product.category.name}
              </Link>

              {product.latest_batch && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-brand-200 text-xs text-brand-700">
                  <LeafIcon className="w-3.5 h-3.5" />
                  <span className="fa-num">
                    تازگی {product.latest_batch.freshness_score} از 100
                  </span>
                </div>
              )}
            </div>

            {/* نام محصول */}
            <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-4 leading-tight">
              {product.name}
            </h1>

            {/* توضیح کوتاه */}
            {product.short_desc && (
              <p className="text-sm text-ink-600 leading-7 mb-6">
                {product.short_desc}
              </p>
            )}

            {/* انتخاب واریانت */}
            <ProductVariantSelector variants={product.variants} />
          </div>
        </div>

        {/* توضیحات کامل */}
        {product.description && (
          <section className="mt-16 pt-10 border-t border-ink-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-brand-700" />
              <h2 className="text-xl font-bold text-ink-900">
                توضیحات محصول
              </h2>
            </div>
            <div className="prose prose-sm max-w-none text-ink-700 leading-8 whitespace-pre-line">
              {product.description}
            </div>
          </section>
        )}

        {/* شناسنامه بچ */}
        {product.latest_batch && (
          <section className="mt-16 pt-10 border-t border-ink-100">
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-brand-700" />
                <h2 className="text-xl font-bold text-ink-900">
                  شناسنامه محصول
                </h2>
              </div>
              <span className="text-xs text-ink-500">
                اطلاعات آخرین بچ تولید
              </span>
            </div>

            {/* کارت شناسنامه */}
            <div className="rounded-2xl border border-ink-200 overflow-hidden">
              {/* سربرگ امتیاز تازگی */}
              <div className="bg-gradient-to-l from-brand-50 to-white p-5 border-b border-ink-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-xs text-ink-500 mb-1">
                      کد بچ
                    </div>
                    <div className="font-mono text-sm font-bold text-ink-900 fa-num">
                      {product.latest_batch.batch_code}
                    </div>
                  </div>

                  <div className="flex-1 min-w-[200px] max-w-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-ink-500">
                        امتیاز تازگی
                      </span>
                      <span className="text-sm font-bold text-brand-700 fa-num">
                        {product.latest_batch.freshness_score.toLocaleString(
                          'fa-IR'
                        )}
                        {' از '}
                        {(100).toLocaleString('fa-IR')}
                      </span>
                    </div>
                    <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-brand-500 to-brand-700 rounded-full transition-all"
                        style={{
                          width: `${product.latest_batch.freshness_score}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* جدول اطلاعات */}
              <table className="w-full text-sm">
                <tbody>
                  <BatchRow
                    label="تأمین‌کننده"
                    value={product.latest_batch.supplier_name ?? 'ثبت نشده'}
                  />
                  <BatchRow
                    label="تاریخ برداشت"
                    value={formatDate(product.latest_batch.harvest_date)}
                  />
                  <BatchRow
                    label="تاریخ برشته‌کاری"
                    value={formatDate(product.latest_batch.roast_date)}
                  />
                  <BatchRow
                    label="تاریخ بسته‌بندی"
                    value={formatDate(product.latest_batch.pack_date)}
                  />
                  <BatchRow
                    label="تاریخ انقضا"
                    value={formatDate(product.latest_batch.expiry_date)}
                    highlight
                  />
                  {product.latest_batch.qc_note && (
                    <BatchRow
                      label="یادداشت کنترل کیفیت"
                      value={product.latest_batch.qc_note}
                      isLast
                    />
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* موجودی شعبات */}
        {branchStock.length > 0 && (
          <section className="mt-16 pt-10 border-t border-ink-100">
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-brand-700" />
                <h2 className="text-xl font-bold text-ink-900">
                  موجودی در شعبات
                </h2>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  totalAvailable > 0
                    ? 'bg-brand-50 text-brand-700'
                    : 'bg-ink-100 text-ink-500'
                }`}
              >
                {totalAvailable > 0
                  ? `${totalAvailable.toLocaleString('fa-IR')} عدد در دسترس`
                  : 'در حال حاضر ناموجود'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {branchStock.map((b) => (
                <div
                  key={b.branch_id}
                  className="rounded-2xl border border-ink-200 p-4 hover:border-brand-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                        <MapPinIcon className="w-4 h-4 text-brand-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-ink-900 truncate">
                          {b.branch_name}
                        </div>
                        <div className="text-[11px] text-ink-500 truncate">
                          {b.branch_phone ?? 'بدون تلفن'}
                        </div>
                      </div>
                    </div>

                    {b.available > 0 ? (
                      <span className="text-xs px-2 py-1 rounded-lg bg-brand-50 text-brand-700 font-medium fa-num shrink-0">
                        {b.available.toLocaleString('fa-IR')} عدد
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-lg bg-ink-100 text-ink-500 shrink-0">
                        ناموجود
                      </span>
                    )}
                  </div>

                  {b.branch_address && (
                    <p className="text-[11px] text-ink-500 leading-5">
                      {b.branch_address}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}

// کامپوننت کمکی برای هر ردیف جدول شناسنامه
function BatchRow({
  label,
  value,
  highlight = false,
  isLast = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  isLast?: boolean;
}) {
  return (
    <tr className={!isLast ? 'border-b border-ink-100' : ''}>
      <td className="px-5 py-3.5 text-ink-500 text-sm w-1/3">{label}</td>
      <td
        className={`px-5 py-3.5 text-sm ${
          highlight ? 'text-brand-700 font-semibold' : 'text-ink-800'
        }`}
      >
        {value}
      </td>
    </tr>
  );
}