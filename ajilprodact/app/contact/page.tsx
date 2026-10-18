import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@/components/Container';
import { ArrowLeftIcon, MapPinIcon, PhoneIcon, TruckIcon } from '@/components/icons';

export const metadata: Metadata = {
    title: 'تماس با ما',
    description:
        'برای سفارش، پشتیبانی و مشاوره درباره آجیل و خشکبار، با ما تماس بگیرید. آدرس شعبه و شماره تماس معتبر.',
    alternates: { canonical: '/contact' },
};

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-cream-50">
            <div className="bg-cream-100 border-b border-coffee-200">
                <Container className="py-3 text-sm text-coffee-600">
                    <Link href="/" className="hover:text-gold-700 transition-colors">
                        خانه
                    </Link>
                    <span className="mx-2 text-coffee-400">/</span>
                    <span className="text-coffee-900">تماس با ما</span>
                </Container>
            </div>

            <section className="py-12 sm:py-16">
                <Container className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-3xl border border-coffee-200 bg-white p-6 sm:p-8 shadow-sm">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-50 border border-gold-200 text-gold-700 text-xs font-medium mb-4">
                            <PhoneIcon className="w-3.5 h-3.5" />
                            تماس سریع
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-coffee-900 mb-4">
                            آماده‌ی پاسخ‌گویی به سوالات شما هستیم
                        </h1>
                        <p className="text-base leading-8 text-coffee-600 max-w-xl">
                            برای سفارش محصولات، مشاوره درباره انتخاب بهترین گزینه‌ها یا هماهنگی
                            خرید حضوری، با ما در ارتباط باشید. تیم پشتیبانی ما در ساعات کاری
                            آماده پاسخگویی است.
                        </p>

                        <div className="mt-8 space-y-5 text-coffee-700">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gold-50 text-gold-700 border border-gold-200">
                                    <PhoneIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm text-coffee-500">تلفن</p>
                                    <a href="tel:02188776655" className="text-lg font-semibold fa-num hover:text-gold-700 transition-colors">
                                        ۰۲۱-۸۸۷۷۶۶۵۵
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gold-50 text-gold-700 border border-gold-200">
                                    <MapPinIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm text-coffee-500">آدرس</p>
                                    <p className="text-lg font-semibold text-coffee-900">
                                        تهران، خیابان ولیعصر، پلاک ۱۲۰۰
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gold-50 text-gold-700 border border-gold-200">
                                    <TruckIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm text-coffee-500">پاسخگویی</p>
                                    <p className="text-lg font-semibold text-coffee-900">
                                        ارسال به سراسر کشور — ۹ صبح تا ۹ شب
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-gradient-to-br from-coffee-800 to-coffee-900 p-6 text-cream-100 shadow-sm">
                        <h2 className="text-2xl font-bold mb-4">سفارش سریع</h2>
                        <p className="text-coffee-200 leading-7">
                            برای خرید سریع، محصولات را از صفحه اصلی و دسته‌بندی‌ها انتخاب کنید
                            و در کوتاه‌ترین زمان سفارش خود را ثبت نمایید.
                        </p>
                        <Link
                            href="/products"
                            className="mt-6 inline-flex items-center gap-2 btn-gold px-5 py-3 rounded-xl"
                        >
                            مشاهده محصولات
                            <ArrowLeftIcon className="w-4 h-4" />
                        </Link>
                    </div>
                </Container>
            </section>
        </main>
    );
}
