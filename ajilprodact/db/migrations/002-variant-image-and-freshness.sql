-- db/migrations/002-variant-image-and-freshness.sql
-- افزودن تصویر به واریانت + تازگی هوشمند

SET NAMES utf8mb4;

-- ==========================================
-- 1. افزودن ستون image_url به product_variants
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
-- 3. پر کردن مقادیر اولیه از داده موجود
-- ==========================================

-- تاریخ پایه: تاریخ بسته‌بندی اگر هست، وگرنه برداشت، وگرنه امروز
UPDATE batches
SET freshness_base_date = COALESCE(pack_date, harvest_date, CURDATE())
WHERE freshness_base_date IS NULL;

-- امتیاز پایه: مقدار فعلی تازگی
UPDATE batches
SET freshness_base_score = freshness_score
WHERE freshness_base_score = 100 AND freshness_score != 100;

-- mariadb -u ajil_user -p ajil_catalog < db/migrations/002-variant-image-and-freshness.sql