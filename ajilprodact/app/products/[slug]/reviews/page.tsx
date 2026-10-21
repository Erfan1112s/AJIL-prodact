// app/products/[slug]/reviews/page.tsx
// صفحه کامل نظرات یک محصول

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/queries/products';
import {
  getProductReviews,
  getProductReviewsCount,
  getProductReviewStats,
  canUserReviewProduct,
  getUserReviewForProduct,
} from '@/lib/queries/reviews';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';
import Container from '@/components/Container';
import ReviewsSummary from '@/components/reviews/ReviewsSummary';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';

// ==========================================
// metadata داینامیک
// ==========================================

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    rating?: string;
    withMedia?: string;
    verified?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'محصول یافت نشد' };
  }

  // آمار برای توضیحات
  const stats = await getProductReviewStats(product.id);

  const description =
    stats.total_count > 0
      ? `${stats.average_rating.toLocaleString('fa-IR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} از ۵ بر اساس ${stats.total_count.toLocaleString('fa-IR')} نظر کاربران`
      : `اولین نظر را برای ${product.name} ثبت کنید`;

  return {
    title: `نظرات ${product.name}`,
    description,
    alternates: {
      canonical: `/products/${product.slug}/reviews`,
    },
    openGraph: {
      title: `نظرات ${product.name}`,
      description,
      type: 'website',
    },
  };
}

// ==========================================
// تنظیمات
// ==========================================

const PER_PAGE = 10;

// انواع مجاز
const VALID_SORTS = ['newest', 'highest', 'lowest', 'helpful'] as const;
type SortType = (typeof VALID_SORTS)[number];

// ==========================================
// کامپوننت صفحه
// ==========================================

export default async function ProductReviewsPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  // ==========================================
  // 1. خواندن محصول
  // ==========================================
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // ==========================================
  // 2. اعتبارسنجی searchParams
  // ==========================================
  const sortBy: SortType = VALID_SORTS.includes(sp.sort as SortType)
    ? (sp.sort as SortType)
    : 'newest';

  const ratingNum = sp.rating ? Number(sp.rating) : NaN;
  const ratingFilter: 1 | 2 | 3 | 4 | 5 | null =
    Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 5
      ? (ratingNum as 1 | 2 | 3 | 4 | 5)
      : null;

  const withMediaOnly = sp.withMedia === '1';
  const verifiedOnly = sp.verified === '1';

  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const offset = (currentPage - 1) * PER_PAGE;

  // ==========================================
  // 3. خواندن اطلاعات کاربر
  // ==========================================
  const customerId = await getCurrentCustomerId();

  // ==========================================
  // 4. کوئری‌های موازی
  // ==========================================
  const [stats, reviews, totalCount] = await Promise.all([
    getProductReviewStats(product.id),
    getProductReviews(product.id, {
      limit: PER_PAGE,
      offset,
      sortBy,
      ratingFilter: ratingFilter ?? undefined,
      withMediaOnly,
      verifiedOnly,
      currentCustomerId: customerId,
    }),
    getProductReviewsCount(product.id, {
      ratingFilter: ratingFilter ?? undefined,
      withMediaOnly,
      verifiedOnly,
    }),
  ]);

  // ==========================================
  // 5. بررسی امکان نظر دادن (اگر لاگین)
  // ==========================================
  let canReview = false;
  let existingReview = null;

  if (customerId) {
    const [canReviewResult, existingReviewResult] = await Promise.all([
      canUserReviewProduct(customerId, product.id),
      getUserReviewForProduct(customerId, product.id),
    ]);
    canReview = canReviewResult;
    existingReview = existingReviewResult;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  // ==========================================
  // 6. رندر
  // ==========================================
  return (
    <main className="min-h-screen">
      {/* ==========================================
          Breadcrumb
          ========================================== */}
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
          <Link
            href={`/products/${product.slug}`}
            className="hover:text-gold-700 transition-colors"
          >
            {product.name}
          </Link>
          <span className="mx-2 text-coffee-400">/</span>
          <span className="text-coffee-900">نظرات</span>
        </Container>
      </div>

      {/* ==========================================
          هدر صفحه
          ========================================== */}
      <section className="bg-gradient-to-b from-gold-50/60 to-cream-50 border-b border-coffee-100">
        <Container className="py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-gold-400 to-gold-700" />
                <h1 className="text-2xl font-bold text-coffee-900">
                  نظرات کاربران
                </h1>
              </div>
              <p className="text-sm text-coffee-600">
                نظرات و تجربه خریداران محصول{' '}
                <Link
                  href={`/products/${product.slug}`}
                  className="font-bold text-gold-700 hover:text-gold-800 transition-colors"
                >
                  {product.name}
                </Link>
              </p>
            </div>

            <Link
              href={`/products/${product.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-coffee-200 text-coffee-700 text-sm font-medium hover:border-gold-400 hover:text-gold-700 transition-colors group"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:translate-x-0.5 transition-transform"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
              صفحه محصول
            </Link>
          </div>
        </Container>
      </section>

      <Container className="py-8 pb-16 space-y-6">
        {/* ==========================================
            خلاصه نظرات
            ========================================== */}
        <ReviewsSummary
          productSlug={product.slug}
          stats={stats}
          canReview={canReview}
          hasExistingReview={Boolean(existingReview)}
        />

        {/* ==========================================
            فرم ثبت/ویرایش نظر
            ========================================== */}
        {canReview && (
          <div id="write-review" className="scroll-mt-24">
            <ReviewForm
              productId={product.id}
              productSlug={product.slug}
              existingReview={
                existingReview
                  ? {
                      id: existingReview.id,
                      rating: existingReview.rating,
                      title: existingReview.title,
                      body: existingReview.body,
                      is_approved: existingReview.is_approved === 1,
                      media: [], // در فایل ۱۶ آن را با کوئری کامل پر می‌کنیم
                    }
                  : null
              }
            />
          </div>
        )}

        {/* ==========================================
            پیام برای کاربران ناشناس
            ========================================== */}
        {!customerId && (
          <div className="rounded-2xl border border-gold-200 bg-gradient-to-l from-gold-50 to-cream-50 p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gold-500 flex items-center justify-center text-coffee-900 shrink-0">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-coffee-900 mb-0.5">
                  می‌خواهید نظر بدهید؟
                </div>
                <div className="text-xs text-coffee-600 leading-5">
                  برای ثبت نظر ابتدا وارد حساب کاربری خود شوید.
                </div>
              </div>
            </div>
            <Link
              href={`/auth/login?from=/products/${product.slug}/reviews`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-gold text-xs font-bold"
            >
              ورود به حساب
            </Link>
          </div>
        )}

        {/* ==========================================
            لیست نظرات با فیلتر
            ========================================== */}
        <ReviewList
          productSlug={product.slug}
          reviews={reviews}
          totalCount={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
          currentSort={sortBy}
          currentRating={ratingFilter}
          currentWithMedia={withMediaOnly}
          currentVerified={verifiedOnly}
          currentCustomerId={customerId}
        />
      </Container>
    </main>
  );
}