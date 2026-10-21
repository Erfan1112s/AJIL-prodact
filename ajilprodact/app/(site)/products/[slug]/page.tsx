// app/products/[slug]/page.tsx
// صفحه تک محصول با نظرات کاربران

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/queries/products';
import { getVariantAvailability } from '@/lib/queries/branches';
import {
  getProductReviewStats,
  canUserReviewProduct,
  getUserReviewWithMedia,
} from '@/lib/queries/reviews';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';
import ProductDetailClient from '@/components/ProductDetailClient';
import ReviewsSummary from '@/components/reviews/ReviewsSummary';
import Container from '@/components/Container';
import { MapPinIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: 'محصول یافت نشد' };

  return {
    title: product.meta_title ?? product.name,
    description: product.meta_desc ?? product.short_desc ?? product.name,
    openGraph: {
      title: product.name,
      description: product.short_desc ?? '',
      type: 'website',
      images: product.images.map((img) => ({
        url: img.url,
        alt: img.alt ?? product.name,
      })),
    },
    alternates: { canonical: `/products/${product.slug}` },
  };
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'ثبت نشده';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'ثبت نشده';
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return 'ثبت نشده';
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const firstVariant = product.variants[0];
  const branchStock = firstVariant
    ? await getVariantAvailability(firstVariant.id)
    : [];

  const totalAvailableUnits = branchStock.reduce(
    (sum, b) => sum + b.available_units,
    0
  );

  // ==========================================
  // نظرات
  // ==========================================
  const customerId = await getCurrentCustomerId();

  const [reviewStats, canReview, existingReview] = await Promise.all([
    getProductReviewStats(product.id),
    customerId
      ? canUserReviewProduct(customerId, product.id)
      : Promise.resolve(false),
    customerId
      ? getUserReviewWithMedia(customerId, product.id)
      : Promise.resolve(null),
  ]);

  return (
    <main className="min-h-screen">
      {/* breadcrumb */}
      <div className="bg-cream-100 border-b border-coffee-200">
        <Container className="py-3 text-sm text-coffee-600">
          <Link href="/" className="hover:text-gold-700 transition-colors">
            خانه
          </Link>
          <span className="mx-2 text-coffee-400">/</span>
          <Link
            href={`/categories/${product.category.slug}`}
            className="hover:text-gold-700 transition-colors"
          >
            {product.category.name}
          </Link>
          <span className="mx-2 text-coffee-400">/</span>
          <span className="text-coffee-900">{product.name}</span>
        </Container>
      </div>

      {/* کلاینت اصلی */}
      <Container className="py-6 sm:py-8">
        <ProductDetailClient product={product} />
      </Container>

      {/* ==========================================
          بخش نظرات
          ========================================== */}
      <Container className="py-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-gold-400 to-gold-700" />
          <h2 className="text-xl font-bold text-coffee-900">
            نظرات کاربران
          </h2>
          {reviewStats.total_count > 0 && (
            <span className="text-xs text-coffee-500 fa-num">
              ({reviewStats.total_count.toLocaleString('fa-IR')} نظر)
            </span>
          )}
        </div>

        <ReviewsSummary
          productSlug={product.slug}
          stats={reviewStats}
          canReview={canReview}
          hasExistingReview={Boolean(existingReview)}
        />
      </Container>

      {/* توضیحات کامل */}
      {product.description && (
        <Container className="py-8">
          <section className="rounded-3xl border border-coffee-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-gold-400 to-gold-700" />
              <h2 className="text-xl font-bold text-coffee-900">
                توضیحات محصول
              </h2>
            </div>
            <div className="text-coffee-700 leading-8 whitespace-pre-line text-sm sm:text-base">
              {product.description}
            </div>
          </section>
        </Container>
      )}

      {/* شناسنامه بچ */}
      {product.latest_batch && (
        <Container className="py-8">
          <section className="rounded-3xl border border-coffee-200 overflow-hidden bg-white">
            <div className="flex items-center justify-between gap-3 p-6 border-b border-coffee-100 flex-wrap bg-gradient-to-l from-gold-50/70 to-white">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-gold-400 to-gold-700" />
                <h2 className="text-xl font-bold text-coffee-900">
                  شناسنامه محصول
                </h2>
              </div>
              <span className="text-xs text-coffee-500">
                اطلاعات آخرین بچ تولید
              </span>
            </div>

            <table className="w-full text-sm">
              <tbody>
                <BatchRow
                  label="کد بچ"
                  value={product.latest_batch.batch_code}
                  ltr
                />
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

                <tr className="border-b border-coffee-100">
                  <td className="px-5 py-3.5 text-coffee-500 text-sm w-1/3">
                    امتیاز تازگی
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-cream-200 rounded-full h-2 max-w-[200px] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-l from-gold-400 to-gold-600 rounded-full"
                          style={{
                            width: `${product.latest_batch.freshness_score}%`,
                          }}
                        />
                      </div>
                      <span className="fa-num text-sm font-bold text-gold-700">
                        {product.latest_batch.freshness_score.toLocaleString(
                          'fa-IR'
                        )}{' '}
                        از ۱۰۰
                      </span>
                    </div>
                  </td>
                </tr>

                {product.latest_batch.qc_note && (
                  <BatchRow
                    label="یادداشت کنترل کیفیت"
                    value={product.latest_batch.qc_note}
                    isLast
                  />
                )}
              </tbody>
            </table>
          </section>
        </Container>
      )}

      {/* موجودی شعبات */}
      {branchStock.length > 0 && (
        <Container className="py-8 pb-16">
          <section>
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-gold-400 to-gold-700" />
                <h2 className="text-xl font-bold text-coffee-900">
                  موجودی در شعبات
                </h2>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full fa-num ${
                  totalAvailableUnits > 0
                    ? 'bg-brand-50 text-brand-700'
                    : 'bg-cream-100 text-coffee-500'
                }`}
              >
                {totalAvailableUnits > 0
                  ? `${totalAvailableUnits.toLocaleString('fa-IR')} بسته در دسترس`
                  : 'در حال حاضر ناموجود'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {branchStock.map((b) => (
                <div
                  key={b.branch_id}
                  className="rounded-2xl border border-coffee-200 bg-white p-4 hover:border-gold-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center shrink-0">
                        <MapPinIcon className="w-4 h-4 text-gold-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-coffee-900 truncate">
                          {b.branch_name}
                        </div>
                        <div className="text-[11px] text-coffee-500 truncate">
                          {b.branch_phone ?? 'بدون تلفن'}
                        </div>
                      </div>
                    </div>

                    {b.available_units > 0 ? (
                      <span className="text-xs px-2 py-1 rounded-lg bg-gold-50 text-gold-700 font-medium fa-num shrink-0 border border-gold-200">
                        {b.available_units.toLocaleString('fa-IR')} بسته
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-lg bg-cream-100 text-coffee-500 shrink-0">
                        ناموجود
                      </span>
                    )}
                  </div>

                  {b.branch_address && (
                    <p className="text-[11px] text-coffee-500 leading-5">
                      {b.branch_address}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </Container>
      )}
    </main>
  );
}

function BatchRow({
  label,
  value,
  highlight = false,
  isLast = false,
  ltr = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  isLast?: boolean;
  ltr?: boolean;
}) {
  return (
    <tr className={!isLast ? 'border-b border-coffee-100' : ''}>
      <td className="px-5 py-3.5 text-coffee-500 text-sm w-1/3">{label}</td>
      <td
        className={`px-5 py-3.5 text-sm ${
          highlight ? 'text-gold-700 font-semibold' : 'text-coffee-800'
        } ${ltr ? 'fa-num' : ''}`}
        dir={ltr ? 'ltr' : 'rtl'}
      >
        {value}
      </td>
    </tr>
  );
}