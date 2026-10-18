-- db/migrations/002-admin-update.sql
-- Migration کامل: تمام تغییرات اسکیمای پروژه
-- این فایل امن است - داده‌های موجود پاک نمی‌شوند

SET NAMES utf8mb4;

-- ==========================================
-- 1. افزودن image_url به product_variants
-- ==========================================

ALTER TABLE product_variants
  ADD COLUMN image_url VARCHAR(500) NULL AFTER sku;

-- ==========================================
-- 2. افزودن ستون‌های تازگی به batches
-- ==========================================

ALTER TABLE batches
  ADD COLUMN freshness_mode ENUM('MANUAL', 'AUTO') NOT NULL DEFAULT 'MANUAL' AFTER expiry_date,
  ADD COLUMN freshness_base_score TINYINT UNSIGNED NOT NULL DEFAULT 100 AFTER freshness_mode,
  ADD COLUMN freshness_base_date DATE NULL AFTER freshness_base_score,
  ADD COLUMN freshness_annual_decay TINYINT UNSIGNED NOT NULL DEFAULT 50 AFTER freshness_base_date;

-- ==========================================
-- 3. افزودن ستون‌های آدرس و ارسال به orders
-- ==========================================

ALTER TABLE orders
  ADD COLUMN province VARCHAR(100) NULL AFTER customer_email,
  ADD COLUMN city VARCHAR(100) NULL AFTER province,
  ADD COLUMN postal_code VARCHAR(10) NULL AFTER city,
  ADD COLUMN subtotal DECIMAL(12, 0) NOT NULL DEFAULT 0 AFTER postal_code,
  ADD COLUMN shipping_cost DECIMAL(12, 0) NOT NULL DEFAULT 0 AFTER subtotal,
  ADD COLUMN delivery_method ENUM('SHIPPING', 'PICKUP') NOT NULL DEFAULT 'SHIPPING' AFTER status,
  ADD COLUMN shipping_provider ENUM('SNAPP', 'POST', 'NONE') NOT NULL DEFAULT 'NONE' AFTER delivery_method,
  ADD COLUMN payment_authority VARCHAR(100) NULL AFTER payment_ref,
  ADD COLUMN payment_verified_at TIMESTAMP NULL AFTER payment_authority,
  ADD COLUMN tracking_code VARCHAR(50) NULL AFTER branch_id;

-- ==========================================
-- 4. پر کردن مقادیر اولیه برای داده‌های موجود
-- ==========================================

-- تازگی: تاریخ پایه از تاریخ بسته‌بندی یا برداشت
UPDATE batches
SET freshness_base_date = COALESCE(pack_date, harvest_date, CURDATE())
WHERE freshness_base_date IS NULL;

-- تازگی: امتیاز پایه از امتیاز فعلی
UPDATE batches
SET freshness_base_score = freshness_score
WHERE freshness_score != 100;

-- سفارشات: subtotal از total_amount
UPDATE orders
SET subtotal = total_amount
WHERE subtotal = 0;

-- سفارشات: delivery_method از order_type
UPDATE orders
SET delivery_method = CASE
  WHEN order_type = 'IN_STORE' THEN 'PICKUP'
  ELSE 'SHIPPING'
END
WHERE delivery_method = 'SHIPPING' AND order_type IS NOT NULL;

-- سفارشات: shipping_provider برای حضوری
UPDATE orders
SET shipping_provider = 'NONE'
WHERE delivery_method = 'PICKUP';

-- سفارشات: shipping_provider پیش‌فرض برای ارسال
UPDATE orders
SET shipping_provider = 'POST'
WHERE delivery_method = 'SHIPPING' AND shipping_provider = 'NONE';

-- ==========================================
-- 5. بررسی نهایی
-- ==========================================

SELECT
  'image_url' AS check_item,
  COUNT(*) AS found
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'product_variants'
  AND column_name = 'image_url'

UNION ALL

SELECT
  'freshness columns' AS check_item,
  COUNT(*) AS found
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'batches'
  AND column_name LIKE 'freshness%'

UNION ALL

SELECT
  'orders new columns' AS check_item,
  COUNT(*) AS found
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'orders'
  AND column_name IN (
    'province', 'city', 'postal_code', 'subtotal',
    'shipping_cost', 'delivery_method', 'shipping_provider',
    'payment_authority', 'payment_verified_at', 'tracking_code'
  );