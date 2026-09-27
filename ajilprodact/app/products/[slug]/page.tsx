// app/products/[slug]/page.tsx
// صفحه تک محصول با جزئیات کامل

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/queries/products';
import { getVariantAvailability } from '@/lib/queries/branches';
import ProductVariantSelector from '@/components/ProductVariantSelector';

// در هر درخواست از دیتابیس بخوان
export const dynamic = 'force-dynamic';

// پراپ‌های دریافتی از Next.js
// params شامل slug مسیر است
interface Props {
  params: Promise<{ slug: string }>;
}

// تابع تولید متادیتا برای SEO
// Next.js این تابع را قبل از رندر صفحه صدا می‌زند
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // در Next.js 15+ params یک Promise است و باید await شود
  const { slug } = await params;

  // گرفتن محصول
  const product = await getProductBySlug(slug);

  // اگر محصول نبود، متادیتای خالی
  if (!product) {
    return { title: 'محصول یافت نشد' };
  }

  return {
    // عنوان: از meta_title استفاده کن، وگرنه نام محصول
    title: product.meta_title ?? product.name,
    description:
      product.meta_desc ?? product.short_desc ?? product.name,

    // OpenGraph برای شبکه‌های اجتماعی
    openGraph: {
      title: product.name,
      description: product.short_desc ?? '',
      type: 'website',
      images: product.images.map((img) => ({
        url: img.url,
        alt: img.alt ?? product.name,
      })),
    },

    // canonical برای جلوگیری از محتوای تکراری
    alternates: {
      canonical: `/products/${product.slug}`,
    },
  };
}

// تابع کمکی برای نمایش قیمت
function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

// تابع کمکی برای نمایش تاریخ شمسی
function formatDate(date: Date | null): string {
  if (!date) return 'ثبت نشده';
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

// کامپوننت اصلی
export default async function ProductPage({ params }: Props) {
  // await params
  const { slug } = await params;

  // گرفتن محصول
  const product = await getProductBySlug(slug);

  // اگر محصول نبود، صفحه 404
  if (!product) {
    notFound();
  }

  // گرفتن موجودی اولین واریانت در همه شعبات
  // برای نمایش اولیه
  const firstVariant = product.variants[0];
  const branchStock = firstVariant
    ? await getVariantAvailability(firstVariant.id)
    : [];

  // تصویر اصلی
  const primaryImage =
    product.images.find((img) => img.is_primary === 1) ?? product.images[0];

  return (
    <main className="min-h-screen">
      {/* نوار بالا با breadcrumb */}
      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-3 text-sm text-zinc-600">
          <Link href="/" className="hover:text-brand-600">
            خانه
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/categories/${product.category.slug}`}
            className="hover:text-brand-600"
          >
            {product.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900">{product.name}</span>
        </div>
      </div>

      {/* بخش اصلی محصول */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ستون چپ: تصویر */}
          <div>
            <div className="aspect-square bg-zinc-100 rounded-lg overflow-hidden relative">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.alt ?? product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400">
                  بدون تصویر
                </div>
              )}
            </div>

            {/* تصاویر کوچک */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {product.images.map((img) => (
                  <div
                    key={img.id}
                    className="aspect-square bg-zinc-100 rounded overflow-hidden relative"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt ?? product.name}
                      fill
                      sizes="25vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ستون راست: اطلاعات */}
          <div>
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>

            {product.short_desc && (
              <p className="text-zinc-600 text-sm mb-4">
                {product.short_desc}
              </p>
            )}

            {/* انتخاب واریانت و قیمت */}
            <ProductVariantSelector variants={product.variants} />
          </div>
        </div>

        {/* بخش توضیحات کامل */}
        {product.description && (
          <section className="mt-12">
            <h2 className="text-lg font-bold mb-3">توضیحات</h2>
            <div className="text-zinc-700 text-sm leading-7 whitespace-pre-line">
              {product.description}
            </div>
          </section>
        )}

        {/* بخش شناسنامه بچ */}
        {product.latest_batch && (
          <section className="mt-12">
            <h2 className="text-lg font-bold mb-3">شناسنامه محصول</h2>
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-zinc-100">
                    <td className="px-4 py-3 text-zinc-500 w-1/3">
                      کد بچ
                    </td>
                    <td className="px-4 py-3 fa-num">
                      {product.latest_batch.batch_code}
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="px-4 py-3 text-zinc-500">تأمین‌کننده</td>
                    <td className="px-4 py-3">
                      {product.latest_batch.supplier_name ?? 'ثبت نشده'}
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="px-4 py-3 text-zinc-500">
                      تاریخ برداشت
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(product.latest_batch.harvest_date)}
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="px-4 py-3 text-zinc-500">
                      تاریخ برشته‌کاری
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(product.latest_batch.roast_date)}
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="px-4 py-3 text-zinc-500">
                      تاریخ بسته‌بندی
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(product.latest_batch.pack_date)}
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="px-4 py-3 text-zinc-500">تاریخ انقضا</td>
                    <td className="px-4 py-3">
                      {formatDate(product.latest_batch.expiry_date)}
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="px-4 py-3 text-zinc-500">
                      امتیاز تازگی
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-100 rounded-full h-2 max-w-[200px]">
                          <div
                            className="bg-brand-600 h-2 rounded-full"
                            style={{
                              width: `${product.latest_batch.freshness_score}%`,
                            }}
                          />
                        </div>
                        <span className="fa-num text-sm font-medium">
                          {product.latest_batch.freshness_score} از 100
                        </span>
                      </div>
                    </td>
                  </tr>
                  {product.latest_batch.qc_note && (
                    <tr>
                      <td className="px-4 py-3 text-zinc-500">
                        یادداشت کنترل کیفیت
                      </td>
                      <td className="px-4 py-3">
                        {product.latest_batch.qc_note}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* بخش موجودی شعبات */}
        {branchStock.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-bold mb-3">
              موجودی در شعبات
            </h2>
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="text-right px-4 py-3 font-medium">
                      شعبه
                    </th>
                    <th className="text-right px-4 py-3 font-medium">
                      آدرس
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      موجودی
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {branchStock.map((b) => (
                    <tr
                      key={b.branch_id}
                      className="border-b border-zinc-100 last:border-b-0"
                    >
                      <td className="px-4 py-3">{b.branch_name}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {b.branch_address ?? 'ثبت نشده'}
                      </td>
                      <td className="px-4 py-3 text-left">
                        {b.available > 0 ? (
                          <span className="text-brand-700 font-medium fa-num">
                            {b.available.toLocaleString('fa-IR')} عدد
                          </span>
                        ) : (
                          <span className="text-zinc-400">ناموجود</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}