import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@/components/Container';
import { ArrowLeftIcon, LeafIcon, ShieldIcon, TruckIcon } from '@/components/icons';

export const metadata: Metadata = {
    title: 'درباره ما',
    description:
        'درباره کاتالوگ آجیل و خشکبار؛ تامین مستقیم از باغات، تضمین کیفیت، شناسنامه دیجیتال و خدمات ارسال سریع.',
    alternates: { canonical: '/about' },
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-cream-50">
            <div className="bg-cream-100 border-b border-coffee-200">
                <Container className="py-3 text-sm text-coffee-600">
                    <Link href="/" className="hover:text-gold-700 transition-colors">
                        خانه
                    </Link>
                    <span className="mx-2 text-coffee-400">/</span>
                    <span className="text-coffee-900">درباره ما</span>
                </Container>
            </div>

            <section className="py-12 sm:py-16">
                <Container className="space-y-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-50 border border-gold-200 text-gold-700 text-xs font-medium mb-4">
                            <LeafIcon className="w-3.5 h-3.5" />
                            تجربه خرید مطمئن از باغ تا سفره
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-coffee-900 leading-tight">
                            درباره فروشگاه آجیل و خشکبار ما
                        </h1>
                        <p className="mt-4 text-base leading-8 text-coffee-600">
                            ما با تمرکز بر تازگی، شفافیت و کیفیت، فروشگاه آنلاین آجیل و
                            خشکبار را طراحی کرده‌ایم تا مشتریان بتوانند با اطمینان، محصولات
                            طبیعی و اصل را انتخاب کنند. هر محصول در مسیر تامین و توزیع، با
                            توجه به استانداردهای بهداشتی و استانداردهای تازه‌سازی بررسی می‌شود.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        <FeatureCard
                            icon={<LeafIcon className="w-6 h-6" />}
                            title="تأمین مستقیم"
                            text="محصولات ما از تامین‌کنندگان معتبر و باغات منتخب تأمین می‌شوند تا کیفیت و تازگی حفظ شود."
                        />
                        <FeatureCard
                            icon={<ShieldIcon className="w-6 h-6" />}
                            title="کنترل کیفیت"
                            text="هر بسته با بررسی دقیق و شناسنامه چک، کیفیت محصول و شرایط نگهداری آن مشخص می‌شود."
                        />
                        <FeatureCard
                            icon={<TruckIcon className="w-6 h-6" />}
                            title="ارسال مطمئن"
                            text="با ارسال سریع به سراسر کشور، تجربه خریدی راحت و بدون دغدغه برای شما فراهم می‌شود."
                        />
                    </div>

                    <div className="rounded-3xl border border-coffee-200 bg-white p-6 sm:p-8 shadow-sm">
                        <h2 className="text-2xl font-bold text-coffee-900 mb-4">
                            چرا مشتریان ما ما را انتخاب می‌کنند؟
                        </h2>
                        <div className="grid gap-5 md:grid-cols-2 text-coffee-700 leading-8">
                            <ul className="space-y-3">
                                <li>• تنوع محصولات در دسته‌بندی‌های کاربردی</li>
                                <li>• برچسب‌گذاری دقیق و شفاف برای هر بسته</li>
                                <li>• قیمت مناسب و رقابتی بدون کاهش کیفیت</li>
                            </ul>
                            <ul className="space-y-3">
                                <li>• امکان خرید آنلاین و حضوری</li>
                                <li>• پشتیبانی سریع و پاسخ‌گویی به سؤالات</li>
                                <li>• تجربه کاربری ساده و حرفه‌ای در تمام صفحات</li>
                            </ul>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-gradient-to-br from-coffee-800 to-coffee-900 p-8 text-cream-100">
                        <h2 className="text-2xl font-bold mb-3">همین حالا سفارش خود را ثبت کنید</h2>
                        <p className="text-coffee-200 leading-7 max-w-2xl">
                            در فروشگاه ما، ترکیب تازگی، شفافیت و سرویس قابل اعتماد با هم
                            کنار هم قرار گرفته‌اند. از محصولات متنوع تا پشتیبانی حرفه‌ای، همه
                            چیز برای یک تجربه خرید مطمئن آماده است.
                        </p>
                        <Link
                            href="/products"
                            className="mt-6 group inline-flex items-center gap-2 btn-gold px-6 py-3 rounded-xl"
                        >
                            مشاهده محصولات
                            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </Container>
            </section>
        </main>
    );
}

function FeatureCard({
    icon,
    title,
    text,
}: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <div className="rounded-2xl border border-coffee-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-50 text-gold-700 border border-gold-200">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-coffee-900 mb-2">{title}</h3>
            <p className="text-sm leading-7 text-coffee-600">{text}</p>
        </div>
    );
}
