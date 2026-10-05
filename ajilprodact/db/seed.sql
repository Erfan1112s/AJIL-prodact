-- db/seed.sql
-- داده اولیه برای تست فاز یک
-- این فایل را با دستور mysql -u root -p ajil_catalog < db/seed.sql اجرا کنید

SET NAMES utf8mb4;

-- ==========================================
-- پاک‌سازی به ترتیب معکوس وابستگی
-- ==========================================
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE branch_inventory;
TRUNCATE TABLE customers;
TRUNCATE TABLE batches;
TRUNCATE TABLE product_images;
TRUNCATE TABLE product_variants;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
TRUNCATE TABLE branches;
TRUNCATE TABLE admin_users;

SET FOREIGN_KEY_CHECKS = 1;

-- بازنشانی AUTO_INCREMENT
ALTER TABLE order_items AUTO_INCREMENT = 1;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE branch_inventory AUTO_INCREMENT = 1;
ALTER TABLE batches AUTO_INCREMENT = 1;
ALTER TABLE product_images AUTO_INCREMENT = 1;
ALTER TABLE product_variants AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE branches AUTO_INCREMENT = 1;
ALTER TABLE admin_users AUTO_INCREMENT = 1;


-- ==========================================
-- دسته‌بندی‌ها
-- ساختار درختی: 3 دسته اصلی و چند زیر‌دسته
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
-- واریانت‌ها (وزن و قیمت)
-- هر محصول دو یا سه وزن دارد
-- ==========================================
INSERT INTO product_variants (product_id, weight_gram, price, compare_price, sku) VALUES
  -- پسته اکبری
  (1, 250,  450000, NULL,   'PST-AKB-250'),
  (1, 500,  880000, 950000, 'PST-AKB-500'),
  (1, 1000, 1720000, NULL,  'PST-AKB-1000'),

  -- بادام درختی
  (2, 250,  280000, NULL, 'BDM-DRK-250'),
  (2, 500,  550000, NULL, 'BDM-DRK-500'),
  (2, 1000, 1080000, NULL, 'BDM-DRK-1000'),

  -- فندق
  (3, 250,  320000, NULL, 'FND-PST-250'),
  (3, 500,  630000, NULL, 'FND-PST-500'),

  -- بادام هندی
  (4, 250,  520000, NULL, 'BDH-SHR-250'),
  (4, 500,  1020000, NULL, 'BDH-SHR-500'),

  -- تخمه
  (5, 250,  120000, NULL, 'TKH-AFT-250'),
  (5, 500,  230000, NULL, 'TKH-AFT-500');


-- ==========================================
-- تصاویر
-- URLهای نمونه (در فاز 2 با ArvanCloud جایگزین می‌شوند)
-- ==========================================
INSERT INTO product_images (product_id, url, alt, sort_order, is_primary) VALUES
  (1, '/images/products/پسته اکبری.jpg', 'پسته اکبری ممتاز', 1, 1),
  (2, '/images/products/بادام درختی خام.jpg', 'بادام درختی خام', 1, 1),
  (3, '/images/products/فندق.jpg', 'فندق با پوست', 1, 1),
  (4, '/images/products/بادام هندی.jpg', 'بادام هندی شور', 1, 1),
  (5, '/images/products/تخمه افتاب گردون.jpg', 'تخمه آفتابگردان', 1, 1);


-- ==========================================
-- بچ‌های تولید
-- ==========================================
INSERT INTO batches
  (batch_code, product_id, supplier_name, harvest_date, roast_date, pack_date, expiry_date, freshness_score, qc_note)
VALUES
  ('P-250901', 1, 'باغات رفسنجان',  '2025-08-20', '2025-09-01', '2025-09-05', '2026-03-05', 95,
   'کیفیت مطلوب، اندازه یکنواخت'),
  ('P-250910', 2, 'باغات سامان',    '2025-08-25', NULL,         '2025-09-10', '2026-03-10', 92,
   'بادام سالم بدون آفت'),
  ('P-250915', 3, 'باغات اشکورات',  '2025-09-01', NULL,         '2025-09-15', '2026-03-15', 90,
   'فندق با مغز پر و تازه'),
  ('P-250918', 4, 'واردات هند',     NULL,         '2025-09-18', '2025-09-18', '2026-03-18', 88,
   'بادام هندی درجه A'),
  ('P-250920', 5, 'کشت داخلی',      '2025-09-10', '2025-09-20', '2025-09-20', '2026-03-20', 93,
   'تخمه درشت و یکنواخت');


-- ==========================================
-- موجودی شعبات
-- هر واریانت در هر شعبه یک ردیف دارد
-- ==========================================
INSERT INTO branch_inventory (branch_id, variant_id, stock) VALUES
  -- شعبه مرکزی (branch 1)
  -- variant_id 1 تا 12 به ترتیب همان محصولات و وزن‌ها هستند
  (1, 1, 45),
  (1, 2, 30),
  (1, 3, 15),
  (1, 4, 50),
  (1, 5, 35),
  (1, 6, 20),
  (1, 7, 25),
  (1, 8, 18),
  (1, 9, 40),
  (1, 10, 22),
  (1, 11, 60),
  (1, 12, 55);


-- ==========================================
-- کاربر ادمین پیش‌فرض
-- نام کاربری: admin
-- رمز: بعدا با bcrypt هش می‌شود، الان placeholder
-- ==========================================
INSERT INTO admin_users (username, password_hash, full_name, role) VALUES
  ('admin', 'fbd7798974ae03f3b3af95d9f9261344:9cf95aeca92f030fe8d222436441f728d1de47c1f0b92e10b3dfde53b72bc3f9b82abb44476be4cd64a2c78eac7600bdca5149cf08e12f6b855ad0a4b8b86753', 'مدیر سیستم', 'SUPER_ADMIN');