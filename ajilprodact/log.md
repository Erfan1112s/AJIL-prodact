### بخش اول در این بخش فقط قسمت اساسی پروژه را می سازیم


- mariadb را نصب کردم پس باید حتما روی سرور هم باشه

- دیتابیس را ساختم جزیات زیاد داره پس تو کد ها کمنت گذاشتم

- روشی که برای انتقال انتخاب کردم :‌ اول روی گیت هاب push کنم و بعد روی هسات pull

# کامند های اتصال به دیتابیس :

- mariadb -u db-username -p pas db-name < db/schema.sql

- ادمین 
- INSERT INTO admin_users (username, password_hash, full_name, role) VALUES
  ('admin', 'fbd7798974ae03f3b3af95d9f9261344:9cf95aeca92f030fe8d222436441f728d1de47c1f0b92e10b3dfde53b72bc3f9b82abb44476be4cd64a2c78eac7600bdca5149cf08e12f6b855ad0a4b8b86753', 'مدیر سیستم', 'SUPER_ADMIN');

feat: پیاده‌سازی کامل فاز یک کاتالوگ آجیل

زیرساخت:
- راه‌اندازی Next.js 16 با TypeScript و Tailwind 4

- تنظیم output standalone برای کاهش حجم روی هاست

- بهینه‌سازی تصاویر با فرمت AVIF و WebP

دیتابیس:
- اتصال MariaDB با connection pool و mysql2

- اسکیمای 11 جدول: categories, products, product_variants,
  product_images, batches, branches, branch_inventory,
  admin_users, customers, orders, order_items

- داده اولیه: 5 محصول، 12 واریانت، 3 شعبه، 5 بچ

لایه کوئری:
- lib/types.ts با تایپ‌های متناظر جداول

- توابع کوئری برای دسته‌بندی، محصول، شعبه، مشتری

- جلوگیری از N+1 با Promise.all و Map

صفحات فروشگاه:
- صفحه اصلی با Hero و محصولات منتخب

- لیست محصولات با صفحه‌بندی

- تک محصول با گالری، انتخاب واریانت، شناسنامه بچ و موجودی شعبه

- لیست درختی دسته‌بندی‌ها

- محصولات هر دسته

طراحی:
- سیستم طراحی کامل با پالت brand/accent/ink

- 13 آیکون SVG درون‌خطی بدون پکیج خارجی

- انیمیشن‌های fade-up و fade-in با CSS

- هدر دو طبقه و منوی موبایل با state

- فوتر چهار ستونه با اطلاعات تماس

- RTL و فونت وزیرمتن

- ریسپانسیو کامل برای موبایل و دسکتاپ

SEO:
- metadata داینامیک برای صفحات محصول و دسته

- canonical URL برای جلوگیری از محتوای تکراری

- OpenGraph برای اشتراک‌گذاری در شبکه‌های اجتماعی

حجم:
- بدون هیچ پکیج اضافه به جز mysql2 و sharp

- حجم کد پروژه زیر 500 کیلوبایت

- هدف هاست با standalone: زیر 150 مگابایت

### فاز ۲ شروع شد

# سبد خرید

- تا حد خوبی جول رفت ولی کامل کامل نشد 

- زمانی کامل می شه که به بخش پرداخت و پنل کاربری وصل بشه 

- و به پنل ادمینی گذارش بده

# پنل ادمینی 

- پنل ادمین کامل نیست فقت قسمت اولش را درست کردمی 

- در بخش بعدی پنل ادمنی را کامل می کنیم

# بخش OTP 

feat: پیاده‌سازی لاگین ادمین و زیرساخت پیامکی SMS.ir

پنل ادمین:
- صفحه لاگین با نام کاربری و رمز عبور
- هش رمز با crypto.scrypt بدون پکیج خارجی
- session با کوکی امضاشده HMAC و Web Crypto API
- middleware محافظت از مسیرهای /admin/*
- داشبورد با آمار محصولات، دسته‌ها، شعبات و مشتریان

سیستم پیامکی:
- ماژول ارتباط با SMS.ir با fetch داخلی
- ماژول OTP با تولید امن، انقضا، محدودیت نرخ و تلاش
- اسکریپت تست SMS.ir

دیتابیس:
- افزودن جدول customers با فیلدهای OTP و رمز عبور
- اسکریپت db-reset برای بازسازی سریع

بدون هیچ پکیج جدید نصب‌شده.

feat: پیاده‌سازی صفحه سفارشات مشتری و طراحی مدرن UI

- صفحه لیست سفارشات مشتری با صفحه‌بندی هوشمند
- صفحه جزئیات سفارش با تصویر محصولات و اطلاعات کامل
- کامپوننت OrderCard با نوار رنگی وضعیت، تصویر، نشان تعداد اقلام
- کامپوننت OrderStatusBadge با آیکون، رنگ روایی و سه اندازه
- کامپوننت OrderStatusStepper برای نمایش پیشرفت سفارش
- توابع کوئری سفارشات در lib/queries/orders.ts
- لینک «سفارش‌های من» در صفحه پروفایل
- طراحی Empty State با دایره‌های تزئینی و سلسله‌مراتب متن
- صفحه‌بندی با حذف هوشمند و دکمه فعال گرادیانت




feat: پیاده‌سازی فاز یک و بخش‌های اصلی فاز دو

توسعه کاتالوگ آجیل و خشکبار با Next.js، MySQL/MariaDB و زرین‌پال.


زیرساخت:

- راه‌اندازی Next.js 16 با TypeScript و App Router
- Tailwind CSS 4 با CSS-first configuration
- فونت Vazirmatn با next/font/google برای self-host
- تنظیم output standalone برای کاهش حجم روی هاست
- بهینه‌سازی تصاویر با فرمت‌های AVIF و WebP
- تنظیم turbopack.resolveAlias برای نگاشت @/*
- فایل .env.example با همه متغیرهای لازم


دیتابیس:

- اتصال MariaDB با mysql2 و connection pool
- تابع کمکی queryRows برای رفع مشکل تایپ QueryResult
- تابع transaction برای عملیات اتمی
- اسکیمای 11 جدول:
  categories, branches, products, product_variants,
  product_images, batches, branch_inventory, admin_users,
  customers, orders, order_items
- جدول customers با فیلدهای national_code, password_hash,
  otp_code, otp_expires_at, otp_attempts, otp_last_sent_at,
  otp_verified_at
- جدول orders با subtotal, shipping_cost, delivery_method,
  shipping_provider, payment_authority, payment_verified_at,
  tracking_code
- داده اولیه: 8 دسته، 5 محصول، 12 واریانت، 1 شعبه،
  5 بچ، 12 ردیف موجودی، 4 مشتری، 3 سفارش نمونه


لایه کوئری:

- lib/types.ts با تایپ‌های متناظر جداول دیتابیس
- lib/queries/categories.ts با 4 تابع
- lib/queries/products.ts با 5 تابع بدون N+1
- lib/queries/branches.ts با 4 تابع
- lib/queries/customers.ts با 4 تابع
- lib/queries/orders.ts با 5 تابع سفارشات
- استفاده از Map و Promise.all برای جلوگیری از N+1


صفحات فروشگاه:

- صفحه اصلی با Hero گرادیانتی و محصولات منتخب
- لیست محصولات با صفحه‌بندی و breadcrumb
- صفحه تک محصول با گالری، انتخاب واریانت، شناسنامه بچ
  و موجودی شعبات
- لیست درختی دسته‌بندی‌ها با زیردسته‌ها
- محصولات هر دسته


سیستم طراحی:

- پالت رنگی قهوه‌ای و طلایی (coffee, gold, cream)
- 16 آیکون SVG درون‌خطی بدون پکیج خارجی
- انیمیشن‌های CSS: fade-up, fade-in, slide-down, shimmer
- کلاس‌های کاربردی: btn-gold, card-warm, text-gradient-gold,
  bg-dotted-gold
- هدر دو طبقه با منوی موبایل و state
- فوتر چهار ستونه با آیکون‌های مزیت
- کارت محصول با تصویر پس‌زمینه و گرادیانت تیره
- ریسپانسیو کامل از موبایل تا دسکتاپ
- RTL کامل با پشتیبانی اعداد فارسی


سبد خرید:

- Context API با useReducer برای مدیریت state
- ذخیره‌سازی خودکار در localStorage
- نشان تعداد در هدر با hydrate امن (جلوگیری از hydration mismatch)
- صفحه /cart با مدیریت تعداد و حذف
- snapshot قیمت و نام محصول در زمان افزودن
- محدودیت حداکثر 10 عدد در هر واریانت
- کامپوننت CartCountBadge برای نشان هدر
- کامپوننت CartClient با خلاصه سفارش و نشان ارسال رایگان


احراز هویت مشتری:

- ثبت‌نام سه مرحله‌ای: شماره، تایید OTP، اطلاعات
- ورود با رمز عبور
- بازیابی رمز با OTP
- session جداگانه با کوکی امضاشده HMAC-SHA256
- middleware محافظت از /checkout و /profile
- اعتبارسنجی مشترک بین client و server
- کامپوننت‌های auth: AuthShell, FormField, PasswordField,
  PhoneInput, OtpInput, CountdownText, Alert, SubmitButton,
  StepDots, AuthFormHeader
- hook useOtpCountdown برای شمارش معکوس
- نشانگر قدرت رمز عبور با نوار پیوسته
- API Route /api/auth/me برای خواندن مشتری فعلی
- کامپوننت CustomerMenuButton در هدر


احراز هویت ادمین:

- صفحه لاگین با نام کاربری و رمز عبور
- هش رمز با crypto.scrypt بدون پکیج خارجی
- تابع verifyPassword با timingSafeEqual
- session ادمین جدا از مشتری
- middleware محافظت از مسیرهای /admin/*
- داشبورد با آمار محصولات، دسته‌ها، شعبات، مشتریان
- اسکریپت generate-admin-hash.mjs برای ساخت هش امن


سیستم پیامکی SMS.ir:

- ماژول lib/auth/sms.ts با fetch داخلی
- تابع sendOtpSms برای ارسال کد تایید
- تابع sendOrderConfirmationSms برای تایید سفارش
- تولید OTP امن با randomInt از node:crypto
- محدودیت نرخ ارسال: 60 ثانیه بین دو ارسال
- انقضای کد: 120 ثانیه
- محدودیت تلاش: 5 بار ناموفق
- اسکریپت test-sms.mjs برای تست SMS.ir


تسویه حساب و پرداخت:

- صفحه /checkout با فرم چندبخشی
- انتخاب روش تحویل: ارسال یا حضوری از شعبه
- انتخاب استان و شهر از لیست 31 استان ایران
- انتخاب شرکت ارسال: اسنپ اکسپرس یا پست پیشتاز
- محاسبه خودکار هزینه ارسال بر اساس وزن و مقصد
- ارسال رایگان برای خرید بالای 2 میلیون تومان
- Server Action ثبت سفارش با transaction
- تایید قیمت‌ها از سمت سرور (جلوگیری از دستکاری)
- ماژول lib/payment/zarinpal.ts
- حالت mock خودکار در development بدون Merchant ID
- مسدودسازی پرداخت در production بدون Merchant ID
- API Route /api/payment/verify برای بازگشت از درگاه
- صفحه موفقیت با جزئیات سفارش
- صفحه خطا با پیام‌های اختصاصی


سفارشات مشتری:

- صفحه /profile/orders با صفحه‌بندی هوشمند
- صفحه جزئیات سفارش با استپر وضعیت
- کامپوننت OrderCard با نوار رنگی وضعیت و تصویر
- کامپوننت OrderStatusBadge با آیکون و سه اندازه
- کامپوننت OrderStatusStepper با انیمیشن پیشرفت
- Empty State با دایره‌های تزئینی
- صفحه‌بندی با حذف هوشمند و دکمه فعال گرادیانت
- لینک «سفارش‌های من» در پروفایل


SEO:

- metadata داینامیک برای صفحات محصول و دسته
- canonical URL برای جلوگیری از محتوای تکراری
- OpenGraph برای اشتراک‌گذاری در شبکه‌های اجتماعی
- robots برای صفحات حساس (noindex)


بهینه‌سازی حجم:

- بدون هیچ پکیج اضافه به جز mysql2 و sharp
- حجم کد پروژه زیر 500 کیلوبایت
- هدف هاست با standalone: زیر 150 مگابایت


اسکریپت‌های کمکی:

- scripts/db-reset.sh برای بازسازی سریع دیتابیس
- scripts/generate-admin-hash.mjs برای هش رمز ادمین
- scripts/test-sms.mjs برای تست SMS.ir


مستندات:

- README.md با راهنمای نصب و کامندهای مهم
- .env.example با همه متغیرهای محیطی
- db/schema.sql با توضیح هر جدول
- db/seed.sql با داده نمونه کامل

feat: پنل ادمین کامل + آپلود تصویر + تازگی هوشمند + ویرایش لحظه‌ای قیمت

- لایوت، داشبورد و CRUD محصولات پنل ادمین
- آپلود تصویر با sharp و ImageUploader (drag & drop)
- تصویر اختصاصی برای هر وزن با تغییر خودکار Hero
- محاسبه تازگی دستی و خودکار با کاهش سالانه
- ویرایش لحظه‌ای قیمت با QuickPriceEdit
- رفع باگ تغییر نکردن تصویر با انتخاب وزن