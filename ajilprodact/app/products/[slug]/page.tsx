// app/products/[slug]/page.tsx
// صفحه تک محصول

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/queries/products';
import { getVariantAvailability } from '@/lib/queries/branches';
import ProductHero from '@/components/ProductHero';
import ProductVariantSelector from '@/components/ProductVariantSelector';
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
    alternates: { canonical: `/products/${product.slug}` },
  };
}

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

  const firstVariant = product.variants[0];
  const branchStock = firstVariant
    ? await getVariantAvailability(firstVariant.id)
    : [];

  const totalAvailable = branchStock.reduce(
    (sum, b) => sum + b.available,
    0
  );

  return (
    <main className="min-h-screen">
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

      <Container className="py-6 sm:py-8">
        <ProductHero product={product} />
      </Container>

      <Container className="py-8">
        <div
          id="variant-selector"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="md:col-span-2">
            <div className="rounded-3xl border border-coffee-200 bg-white p-5 sm:p-6">
              <ProductVariantSelector
               variants={product.variants}
               productId={product.id}
               productName={product.name}
               productSlug={product.slug}
               productImage={
                product.images.find((img) => img.is_primary === 1)?.url ??
                product.images[0]?.url ??
                null
               }
               />
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-coffee-200 bg-white p-5">
              <div className="text-xs text-coffee-500 mb-2">موجودی کل</div>
              <div
                className={`text-lg font-bold fa-num ${
                  totalAvailable > 0
                    ? 'text-gold-700'
                    : 'text-coffee-400'
                }`}
              >
                {totalAvailable > 0
                  ? `${totalAvailable.toLocaleString('fa-IR')} عدد`
                  : 'ناموجود'}
              </div>
              <div className="text-[11px] text-coffee-500 mt-1">
                در {branchStock.length.toLocaleString('fa-IR')} شعبه
              </div>
            </div>

            {product.latest_batch && (
              <div className="rounded-2xl border border-coffee-200 bg-white p-5">
                <div className="text-xs text-coffee-500 mb-2">
                  آخرین بچ تولید
                </div>
                <div className="font-mono text-sm font-bold text-coffee-900 fa-num mb-2">
                  {product.latest_batch.batch_code}
                </div>
                <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-gold-400 to-gold-600 rounded-full"
                    style={{
                      width: `${product.latest_batch.freshness_score}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] text-coffee-500 mt-2 fa-num">
                  امتیاز تازگی{' '}
                  {product.latest_batch.freshness_score.toLocaleString(
                    'fa-IR'
                  )}{' '}
                  از ۱۰۰
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>

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
          </section>
        </Container>
      )}

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

                    {b.available > 0 ? (
                      <span className="text-xs px-2 py-1 rounded-lg bg-gold-50 text-gold-700 font-medium fa-num shrink-0 border border-gold-200">
                        {b.available.toLocaleString('fa-IR')} عدد
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
}: {
  label: string;
  value: string;
  highlight?: boolean;
  isLast?: boolean;
}) {
  return (
    <tr className={!isLast ? 'border-b border-coffee-100' : ''}>
      <td className="px-5 py-3.5 text-coffee-500 text-sm w-1/3">{label}</td>
      <td
        className={`px-5 py-3.5 text-sm ${
          highlight ? 'text-gold-700 font-semibold' : 'text-coffee-800'
        }`}
      >
        {value}
      </td>
    </tr>
  );
}