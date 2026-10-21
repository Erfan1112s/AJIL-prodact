-- db/seed.sql
-- داده اولیه پروژه کاتالوگ آجیل و خشکبار
-- با ساختار جدید: بسته‌بندی چندگانه + موجودی وزن‌محور + نظرات

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- پاک‌سازی جدول‌ها (ترتیب: فرزندان قبل از والدین)
-- ==========================================
DELETE FROM review_votes;
DELETE FROM review_media;
DELETE FROM product_reviews;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM product_branch_stock;
DELETE FROM customers;
DELETE FROM batches;
DELETE FROM product_images;
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM branches;
DELETE FROM admin_users;

-- بازنشانی AUTO_INCREMENT
ALTER TABLE review_votes AUTO_INCREMENT = 1;
ALTER TABLE review_media AUTO_INCREMENT = 1;
ALTER TABLE product_reviews AUTO_INCREMENT = 1;
ALTER TABLE order_items AUTO_INCREMENT = 1;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE product_branch_stock AUTO_INCREMENT = 1;
ALTER TABLE customers AUTO_INCREMENT = 1;
ALTER TABLE batches AUTO_INCREMENT = 1;
ALTER TABLE product_images AUTO_INCREMENT = 1;
ALTER TABLE product_variants AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE branches AUTO_INCREMENT = 1;
ALTER TABLE admin_users AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;


-- ==========================================
-- دسته‌بندی‌ها
-- ==========================================
INSERT INTO categories (id, name, slug, description, parent_id, sort_order) VALUES
  (1, 'آجیل', 'ajil', 'انواع آجیل شور و خام', NULL, 1),
  (2, 'خشکبار', 'khoshkbar', 'انواع خشکبار و میوه خشک', NULL, 2),
  (3, 'پک هدیه', 'pack-hediye', 'پک‌های هدیه و مناسبت‌ها', NULL, 3),
  (4, 'پسته', 'peste', 'انواع پسته', 1, 1),
  (5, 'بادام', 'badam', 'انواع بادام', 1, 2),
  (6, 'فندق', 'fandogh', 'انواع فندق', 1, 3),
  (7, 'بادام هندی', 'badam-hendi', 'انواع بادام هندی', 1, 4),
  (8, 'تخمه', 'tokhme', 'انواع تخمه', 1, 5);


-- ==========================================
-- شعبات
-- ==========================================
INSERT INTO branches (id, name, slug, address, phone, lat, lng) VALUES
  (1, 'شعبه مرکزی', 'markazi', 'اصفهان، خیابان چهارباغ بالا، پلاک ۱۲۰', '03188776655', 32.6546000, 51.6680000);


-- ==========================================
-- محصولات
-- ==========================================
INSERT INTO products
  (id, name, slug, short_desc, description, category_id, meta_title, meta_desc, is_active, is_featured)
VALUES
  (1, 'پسته اکبری ممتاز', 'peste-akbari-momtaz',
   'پسته اکبری درشت و خندان، برشته با نمک دریایی',
   'پسته اکبری یکی از مرغوب‌ترین انواع پسته ایرانی است. این محصول از باغات رفسنجان تأمین می‌شود و با نمک دریایی برشته می‌شود.',
   4, 'خرید پسته اکبری ممتاز', 'پسته اکبری درشت و خندان با کیفیت صادراتی، ارسال سریع',
   1, 1),

  (2, 'بادام درختی خام', 'badam-darakhti-kham',
   'بادام درختی خام و طبیعی، مناسب رژیم غذایی',
   'بادام درختی خام بدون هیچ افزودنی، مناسب برای مصرف روزانه و رژیم‌های غذایی سالم.',
   5, 'خرید بادام درختی خام', 'بادام درختی خام و طبیعی با کیفیت عالی',
   1, 1),

  (3, 'فندق با پوست', 'fandogh-ba-pust',
   'فندق تازه با پوست، مناسب پذیرایی',
   'فندق با پوست از باغات اشکورات تأمین می‌شود. طعم تازه و مغز پر.',
   6, 'خرید فندق با پوست', 'فندق تازه با پوست از باغات اشکورات',
   1, 0),

  (4, 'بادام هندی شور', 'badam-hendi-shor',
   'بادام هندی برشته و شور، مناسب پذیرایی',
   'بادام هندی درجه یک، برشته شده با روغن گیاهی و نمک.',
   7, 'خرید بادام هندی شور', 'بادام هندی درجه یک برشته و شور',
   1, 1),

  (5, 'تخمه آفتابگردان شور', 'tokhme-aftabgardan-shor',
   'تخمه آفتابگردان شور و تازه',
   'تخمه آفتابگردان با نمک متوسط، برشته شده در کارگاه.',
   8, 'خرید تخمه آفتابگردان', 'تخمه آفتابگردان تازه و شور',
   1, 0);


-- ==========================================
-- واریانت‌ها (وزن + بسته‌بندی)
-- شناسه‌های خودکار:
--   1: پسته 250g استاندارد
--   2: پسته 500g استاندارد
--   3: پسته 1000g استاندارد
--   4: پسته 500g جعبه هدیه
--   5: بادام 250g
--   6: بادام 500g
--   7: بادام 1000g
--   8: فندق 250g
--   9: فندق 500g
--   10: بادام هندی 250g
--   11: بادام هندی 500g
--   12: تخمه 250g
--   13: تخمه 500g
-- ==========================================
INSERT INTO product_variants
  (product_id, weight_gram, packaging_type, packaging_label, price, compare_price, sku, image_url) VALUES
  -- پسته اکبری
  (1, 250,  'standard',  NULL,              450000,  NULL,   'PST-AKB-250',      NULL),
  (1, 500,  'standard',  NULL,              880000,  950000, 'PST-AKB-500',      NULL),
  (1, 1000, 'standard',  NULL,              1720000, NULL,   'PST-AKB-1000',     NULL),
  (1, 500,  'gift_box',  'جعبه هدیه چوبی',  980000,  NULL,   'PST-AKB-500-GIFT', NULL),

  -- بادام درختی
  (2, 250,  'standard',  NULL, 280000,  NULL, 'BDM-DRK-250',  NULL),
  (2, 500,  'standard',  NULL, 550000,  NULL, 'BDM-DRK-500',  NULL),
  (2, 1000, 'standard',  NULL, 1080000, NULL, 'BDM-DRK-1000', NULL),

  -- فندق
  (3, 250,  'standard',  NULL, 320000, NULL, 'FND-PST-250', NULL),
  (3, 500,  'standard',  NULL, 630000, NULL, 'FND-PST-500', NULL),

  -- بادام هندی
  (4, 250,  'standard',  NULL, 520000,  NULL, 'BDH-SHR-250', NULL),
  (4, 500,  'standard',  NULL, 1020000, NULL, 'BDH-SHR-500', NULL),

  -- تخمه
  (5, 250,  'standard',  NULL, 120000, NULL, 'TKH-AFT-250', NULL),
  (5, 500,  'standard',  NULL, 230000, NULL, 'TKH-AFT-500', NULL);


-- ==========================================
-- تصاویر محصولات
-- ==========================================
INSERT INTO product_images (product_id, url, alt, sort_order, is_primary) VALUES
  (1, '/images/products/پسته اکبری.jpg',   'پسته اکبری ممتاز',          1, 1),
  (2, '/images/products/بادام درختی خام.jpg', 'بادام درختی خام',           1, 1),
  (3, '/images/products/فندق.jpg',        'فندق با پوست',              1, 1),
  (4, '/images/products/بادام هندی.jpg',    'بادام هندی شور',            1, 1),
  (5, '/images/products/تخمه افتاب گردون.jpg',         'تخمه آفتابگردان',           1, 1);


-- ==========================================
-- بچ‌های تولید (با ستون‌های تازگی)
-- ==========================================
INSERT INTO batches
  (batch_code, product_id, supplier_name, harvest_date, roast_date, pack_date, expiry_date,
   freshness_mode, freshness_score, freshness_base_score, freshness_base_date,
   freshness_annual_decay, qc_note)
VALUES
  ('P-250901', 1, 'باغات رفسنجان', '2025-08-20', '2025-09-01', '2025-09-05', '2026-03-05',
   'MANUAL', 95, 95, '2025-09-05', 50, 'کیفیت مطلوب، اندازه یکنواخت'),
  ('P-250910', 2, 'باغات سامان',   '2025-08-25', NULL,         '2025-09-10', '2026-03-10',
   'MANUAL', 92, 92, '2025-09-10', 50, 'بادام سالم بدون آفت'),
  ('P-250915', 3, 'باغات اشکورات', '2025-09-01', NULL,         '2025-09-15', '2026-03-15',
   'MANUAL', 90, 90, '2025-09-15', 50, 'فندق با مغز پر و تازه'),
  ('P-250918', 4, 'واردات هند',    NULL,         '2025-09-18', '2025-09-18', '2026-03-18',
   'MANUAL', 88, 88, '2025-09-18', 50, 'بادام هندی درجه A'),
  ('P-250920', 5, 'کشت داخلی',     '2025-09-10', '2025-09-20', '2025-09-20', '2026-03-20',
   'MANUAL', 93, 93, '2025-09-20', 50, 'تخمه درشت و یکنواخت');


-- ==========================================
-- موجودی شعبه (بر اساس وزن)
-- هر محصول یک وزن کل در شعبه دارد
-- ==========================================
INSERT INTO product_branch_stock
  (branch_id, product_id, total_weight_grams, reserved_weight_grams)
VALUES
  (1, 1, 75000, 0),   -- پسته: 75 کیلوگرم
  (1, 2, 55000, 0),   -- بادام درختی: 55 کیلوگرم
  (1, 3, 25000, 0),   -- فندق: 25 کیلوگرم
  (1, 4, 45000, 0),   -- بادام هندی: 45 کیلوگرم
  (1, 5, 50000, 0);   -- تخمه: 50 کیلوگرم


-- ==========================================
-- مشتریان نمونه
-- ==========================================
INSERT INTO customers
  (id, phone, full_name, email, default_address, order_count, last_order_at)
VALUES
  (1, '09121234567', 'علی رضایی',  'ali@example.com',    'اصفهان، سعادت‌آباد، کوچه 5', 3, '2025-09-20 10:30:00'),
  (2, '09351112233', 'مریم احمدی', 'maryam@example.com', 'اصفهان، ونک، خیابان گاندی',  1, '2025-09-18 15:45:00'),
  (3, '09197778899', 'حسن کریمی',  NULL,                 'کرج، عظیمیه، بلوار اصلی',   5, '2025-09-22 09:00:00'),
  (4, '09361234567', 'زهرا موسوی', NULL,                 NULL,                         0, NULL);


-- ==========================================
-- سفارشات نمونه
-- ==========================================
INSERT INTO orders
  (order_number, customer_id, customer_name, customer_phone,
   province, city, address, postal_code,
   subtotal, shipping_cost, total_amount,
   status, delivery_method, shipping_provider,
   payment_method, payment_ref, branch_id, created_at)
VALUES
  ('ORD-1404001', 1, 'علی رضایی', '09121234567',
   'اصفهان', 'اصفهان', 'خیابان چهارباغ بالا، پلاک 45، واحد 3', '8173954876',
   880000, 0, 880000,
   'DELIVERED', 'SHIPPING', 'POST',
   'zarinpal', '123456789', NULL, '2025-09-20 10:30:00'),

  ('ORD-1404002', 2, 'مریم احمدی', '09351112233',
   'اصفهان', 'اصفهان', 'خیابان توحید، پلاک 12', '8173964877',
   450000, 45000, 495000,
   'PAID', 'SHIPPING', 'SNAPP',
   'zarinpal', '987654321', NULL, '2025-09-18 15:45:00'),

  ('ORD-1404003', 3, 'حسن کریمی', '09197778899',
   NULL, NULL, NULL, NULL,
   1720000, 0, 1720000,
   'SHIPPED', 'PICKUP', 'NONE',
   NULL, NULL, 1, '2025-09-22 09:00:00');


-- ==========================================
-- اقلام سفارش (با packaging)
-- ==========================================
INSERT INTO order_items
  (order_id, product_id, variant_id, product_name, weight_gram,
   packaging_type, packaging_label, price, quantity)
VALUES
  (1, 1, 2, 'پسته اکبری ممتاز', 500,  'standard', NULL, 880000,  1),
  (2, 1, 1, 'پسته اکبری ممتاز', 250,  'standard', NULL, 450000,  1),
  (3, 1, 3, 'پسته اکبری ممتاز', 1000, 'standard', NULL, 1720000, 1);


-- ==========================================
-- نظر نمونه (تاییدشده)
-- از مشتری 1 (علی رضایی) برای پسته اکبری
-- چون سفارش ORD-1404001 با وضعیت DELIVERED دارد
-- ==========================================
INSERT INTO product_reviews
  (product_id, customer_id, rating, title, body,
   is_verified_purchase, is_approved, approved_at, created_at)
VALUES
  (1, 1, 5, 'عالی بود',
   'کیفیت پسته اکبری فوق‌العاده بود. تازه و خوش‌طعم. حتماً دوباره سفارش می‌دم.',
   1, 1, '2025-09-25 10:00:00', '2025-09-22 14:30:00');


-- ==========================================
-- کاربر ادمین
-- توجه: این هش با هیچ رمزی مطابقت ندارد
-- بعد از ایمپورت، با دستور زیر هش جدید بساز:
--   node scripts/generate-admin-hash.mjs 'رمز-دلخواه'
-- و در دیتابیس جایگزین کن
-- ==========================================
INSERT INTO admin_users (username, password_hash, full_name, role) VALUES
  ('admin', 'ab7b41b119b2e0b55902222d3eedf82c:57cb23289295fdc7f0b5765295009bbbcd9460e0c7eb4d806363a5fe1d8be44a998509e2ac53f27230fe850200fdf6ffcd6a573a24a23407d08f8dc38c7423f6', 'مدیر سیستم', 'SUPER_ADMIN');



