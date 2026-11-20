# وضعیت و راهنمای پرداخت تیکارت

## وضعیت فعلی

اتصال واقعی تیکارت عمداً فعال نشده است. هنگام بررسی در ۲۰۲۶-۱۱-۲۰، صفحه اصلی، مستندات، قیمت‌ها و sitemap رسمی `tcartt.com` از محیط بررسی با HTTP 502 در دسترس نبودند. بنابراین این موارد هنوز تأیید نشده‌اند:

- روش احراز هویت، مسیر و پارامترهای ایجاد فاکتور، واحد مبلغ و حداقل/حداکثر پرداخت
- قالب شناسه فاکتور و نشانی پرداخت
- callback یا webhook، امضا و روش اعتبارسنجی سمت سرور
- مسیر استعلام وضعیت و وضعیت‌های پرداخت
- تکرار callback، idempotency، sandbox، محدودیت نرخ و طرح/اشتراک لازم
- نیاز به Android یا دریافت پیامک و محدودیت‌های استفاده تجاری

هیچ endpoint، header، فیلد، امضا یا رفتار API برای تیکارت حدس زده نشده است. provider موجود فقط خطای امن می‌دهد؛ انتخاب آن باعث ثبت پرداخت موفق یا redirect ساختگی نمی‌شود.

## اقدام لازم از تیکارت

از کانال پشتیبانی اعلام‌شده در درخواست پروژه [@tcart_support](https://t.me/tcart_support) بخواهید مستندات رسمی و نسخه‌دار API را ارائه کند. لازم است پاسخ کتبی برای موارد زیر دریافت شود:

1. احراز هویت، نگهداری و چرخش credentialها
2. درخواست ایجاد فاکتور: URL رسمی، method، headers، body، واحد پول و پاسخ نمونه
3. شناسه یکتای فاکتور، URL پرداخت و idempotency key (در صورت پشتیبانی)
4. callback/webhook: URL، method، payload، signature و جلوگیری از replay
5. endpoint استعلام server-to-server و تطبیق مبلغ/ارز/شناسه سفارش
6. معانی statusها، retryها، callbackهای تکراری، timeout، refund و پرداخت منقضی
7. sandbox/test credentials، محدودیت نرخ و الزام اشتراک/هزینه
8. نیاز احتمالی به Android/SMS receiver و محدودیت‌های استفاده تجاری

منابع رسمی بررسی‌شده: [وب‌سایت](https://tcartt.com/)، [مستندات](https://tcartt.com/docs)، [قیمت‌ها](https://tcartt.com/pricing). پاسخ HTTP 502 مانع تأیید محتوای آن‌ها شد؛ این گزارش به معنی تأیید یا رد هیچ قابلیت تیکارت نیست.

## راه‌اندازی فعلی زرین‌پال

1. از `.env.example` یک فایل محیطی امن بسازید؛ آن را به Git اضافه نکنید.
2. روی HTTPS، `NEXT_PUBLIC_BASE_URL` را برابر origin عمومی سایت بگذارید؛ مسیر callback برنامه به شکل `https://<domain>/api/payment/verify?order=<orderNumber>` ساخته می‌شود.
3. `PAYMENT_GATEWAY=zarinpal`، `ZARINPAL_MERCHANT_ID` و `ZARINPAL_SANDBOX` را در محیط سرور تنظیم کنید. در production، نبود merchant ID پرداخت را مسدود می‌کند؛ mock فقط در development است.
4. migration شماره ۰۰۷ را یک‌بار پس از backup روی همان پایگاه داده اجرا کنید:

   ```sh
   mariadb -u "$DB_USER" -p "$DB_NAME" < db/migrations/007-payment-gateway.sql
   ```

5. برنامه را روی Node.js نسخه `20.9.0` یا بالاتر اجرا کنید (نیازمندی نسخه نصب‌شده Next.js 16.4.6). خروجی standalone به سرور Node.js نیاز دارد؛ هاست ایستای PHP به‌تنهایی کافی نیست. فایل‌های `.next/static` و `public` نیز باید کنار خروجی standalone کپی شوند.
6. ابتدا با sandbox زرین‌پال در staging، درخواست، بازگشت callback، تطبیق authority، مبلغ، ثبت تکراری و سناریوی خطا را بررسی کنید. اجرای mock جایگزین آزمون پرداخت واقعی نیست.

مبلغ سفارش در دیتابیس به تومان نگهداری می‌شود و adapter زرین‌پال برای API مبلغ را به ریال تبدیل می‌کند. callback صرفاً پس از تایید server-to-server و تطبیق authority ذخیره‌شده می‌تواند سفارش را نهایی کند.

## Migration و بازگشت

Migration ۰۰۷ فقط ستون‌ها و index پرداخت را اضافه می‌کند؛ جدول یا سفارش موجودی را حذف/بازنویسی نمی‌کند. آن را روی داده production بدون backup اجرا نکنید و بیش از یک بار اجرا نکنید.

برای بازگشت، ابتدا `PAYMENT_GATEWAY=zarinpal` را تنظیم و برنامه را restart کنید. حذف ستون‌ها الزامی نیست و حفظ آن‌ها اطلاعات audit را نگه می‌دارد. فقط اگر واقعاً لازم است migration را rollback کنید، ابتدا از پایگاه داده backup بگیرید؛ حذف index/ستون‌های جدید، اطلاعات ثبت‌شده در آن‌ها را از بین می‌برد:

```sql
ALTER TABLE orders
  DROP INDEX idx_orders_payment_gateway,
  DROP COLUMN payment_admin_note,
  DROP COLUMN payment_verified_admin_id,
  DROP COLUMN payment_verified_by_admin,
  DROP COLUMN payment_receipt_url,
  DROP COLUMN payment_gateway;
```

این rollback روی سفارش‌های قبلی اثری ندارد، اما داده‌های provider و audit ذخیره‌شده در ستون‌های جدید را حذف می‌کند. برای تغییر مسیر به زرین‌پال، متغیر محیطی را عوض و برنامه را restart کنید؛ سفارش‌های در انتظار باید با provider ذخیره‌شده خودشان تایید شوند، نه با provider انتخاب‌شده برای سفارش‌های جدید.

## فعال‌سازی آینده تیکارت

تا دریافت مشخصات رسمی، `PAYMENT_GATEWAY=tikart` را در staging یا production تنظیم نکنید؛ provider فعلی عمداً پرداخت را رد می‌کند. پس از دریافت مستندات و sandbox رسمی، پیاده‌سازی باید همراه با تست امضا و استعلام server-to-server، تطبیق مبلغ/ارز/سفارش، idempotency و آزمون callbackهای تکراری بازبینی شود. سپس می‌توان آن را ابتدا در staging فعال کرد. هیچ نام متغیر یا credential اختصاصی تیکارت در این راهنما جعل نشده است.
