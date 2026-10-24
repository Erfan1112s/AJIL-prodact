// app/admin/reviews/page.tsx
// لیست نظرات در پنل ادمین

import type { Metadata } from 'next';
import {
  getAdminReviews,
  getAdminReviewsCount,
  type GetAdminReviewsOptions,
} from '@/lib/queries/reviews';
import ReviewsTable from '@/components/admin/reviews/ReviewsTable';

export const metadata: Metadata = {
  title: 'نظرات کاربران',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const PER_PAGE = 20;

interface Props {
  searchParams: Promise<{
    search?: string;
    status?: string;
    rating?: string;
    page?: string;
  }>;
}

export default async function AdminReviewsPage({ searchParams }: Props) {
  const params = await searchParams;

  const search = params.search ?? '';
  const status: 'all' | 'approved' | 'pending' =
    params.status === 'approved' || params.status === 'pending'
      ? params.status
      : 'all';

  const ratingNum = params.rating ? Number(params.rating) : NaN;
  const ratingFilter: 1 | 2 | 3 | 4 | 5 | undefined =
    Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 5
      ? (ratingNum as 1 | 2 | 3 | 4 | 5)
      : undefined;

  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const offset = (currentPage - 1) * PER_PAGE;

  const queryOptions: GetAdminReviewsOptions = {
    search,
    status,
    ratingFilter,
    limit: PER_PAGE,
    offset,
  };

  const [reviews, totalCount] = await Promise.all([
    getAdminReviews(queryOptions),
    getAdminReviewsCount(queryOptions),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  return (
    <ReviewsTable
      reviews={reviews}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      currentSearch={search}
      currentStatus={status}
      currentRating={ratingFilter ?? null}
    />
  );
}