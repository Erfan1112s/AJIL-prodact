-- db/schema.sql
-- اسکیمای کامل فاز یک پروژه کاتالوگ آجیل و خشکبار
-- این فایل را با دستور mysql -u root -p ajil_catalog < db/schema.sql اجرا کنید

-- تمام جدول‌ها با این تنظیمات ساخته می‌شوند:
-- ENGINE=InnoDB: موتور تراکنشی
-- CHARSET=utf8mb4: پشتیبانی از فارسی و ایموجی
-- COLLATE=utf8mb4_unicode_ci: مقایسه و مرتب‌سازی درست فارسی

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


-- ==========================================
-- جدول 1: categories
-- دسته‌بندی محصولات به صورت درختی
-- مثال: خشکبار > آجیل > پسته
-- ==========================================
CREATE TABLE categories (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(120) NOT NULL,
  description   TEXT NULL,
  image_url     VARCHAR(500) NULL,
  parent_id     INT UNSIGNED NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_categories_slug (slug),
  KEY idx_categories_parent (parent_id),
  KEY idx_categories_active_sort (is_active, sort_order),
  CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id) REFERENCES categories(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 2: products
-- اطلاعات پایه هر محصول (بدون قیمت)
-- قیمت در جدول product_variants است
-- ==========================================
CREATE TABLE products (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(200) NOT NULL,
  slug          VARCHAR(220) NOT NULL,
  description   TEXT NULL,
  short_desc    VARCHAR(500) NULL,
  category_id   INT UNSIGNED NOT NULL,
  meta_title    VARCHAR(70) NULL,
  meta_desc     VARCHAR(160) NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  is_featured   TINYINT(1) NOT NULL DEFAULT 0,
  view_count    INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_products_slug (slug),
  KEY idx_products_category (category_id),
  KEY idx_products_active_featured (is_active, is_featured),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 3: product_variants
-- وزن‌ها و قیمت‌های هر محصول
-- مثال: پسته اکبری، 250 گرم، 450000 تومان
-- قیمت اینجاست چون هفتگی تغییر می‌کند
-- ==========================================
CREATE TABLE product_variants (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id     INT UNSIGNED NOT NULL,
  weight_gram    INT UNSIGNED NOT NULL,
  price          DECIMAL(12, 0) NOT NULL,
  compare_price  DECIMAL(12, 0) NULL,
  sku            VARCHAR(50) NULL,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_variants_sku (sku),
  UNIQUE KEY uk_variants_product_weight (product_id, weight_gram),
  KEY idx_variants_product_active (product_id, is_active),
  CONSTRAINT fk_variants_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 4: product_images
-- تصاویر هر محصول
-- فقط URL ذخیره می‌شود، فایل روی سرور ذخیره‌سازی ابری است
-- ==========================================
CREATE TABLE product_images (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id   INT UNSIGNED NOT NULL,
  url          VARCHAR(500) NOT NULL,
  alt          VARCHAR(200) NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  is_primary   TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_images_product_primary (product_id, is_primary),
  KEY idx_images_product_sort (product_id, sort_order),
  CONSTRAINT fk_images_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 5: batches
-- شناسنامه هر بچ تولید
-- از این جدول برای نمایش تازگی محصول استفاده می‌شود
-- ==========================================
CREATE TABLE batches (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  batch_code       VARCHAR(30) NOT NULL,
  product_id       INT UNSIGNED NOT NULL,
  supplier_name    VARCHAR(150) NULL,
  harvest_date     DATE NULL,
  roast_date       DATE NULL,
  pack_date        DATE NULL,
  expiry_date      DATE NULL,
  freshness_score  TINYINT UNSIGNED NOT NULL DEFAULT 100,
  qc_note          TEXT NULL,
  is_active        TINYINT(1) NOT NULL DEFAULT 1,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_batches_code (batch_code),
  KEY idx_batches_product (product_id),
  KEY idx_batches_freshness (freshness_score),
  CONSTRAINT fk_batches_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 6: branches
-- شعب فیزیکی فروشگاه
-- ==========================================
CREATE TABLE branches (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(120) NOT NULL,
  address     TEXT NULL,
  phone       VARCHAR(15) NULL,
  lat         DECIMAL(10, 7) NULL,
  lng         DECIMAL(10, 7) NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_branches_slug (slug),
  KEY idx_branches_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 7: branch_inventory
-- موجودی هر وزن محصول در هر شعبه
-- ==========================================
CREATE TABLE branch_inventory (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id   INT UNSIGNED NOT NULL,
  variant_id  INT UNSIGNED NOT NULL,
  stock       INT NOT NULL DEFAULT 0,
  reserved    INT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_inventory_branch_variant (branch_id, variant_id),
  KEY idx_inventory_variant (variant_id),
  CONSTRAINT fk_inventory_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 8: admin_users
-- کاربران پنل ادمین
-- رمز با bcrypt یا مشابه هش می‌شود، هرگز plain text ذخیره نمی‌شود
-- ==========================================
CREATE TABLE admin_users (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username       VARCHAR(50) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  full_name      VARCHAR(100) NULL,
  role           ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR') NOT NULL DEFAULT 'ADMIN',
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at  TIMESTAMP NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_admin_username (username),
  KEY idx_admin_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 9: orders
-- سفارشات مشتریان
-- دو حالت: خرید آنلاین یا خرید حضوری از شعبه
-- ==========================================
CREATE TABLE orders (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number    VARCHAR(20) NOT NULL,
  customer_name   VARCHAR(100) NOT NULL,
  customer_phone  VARCHAR(15) NOT NULL,
  customer_email  VARCHAR(100) NULL,
  address         TEXT NULL,
  total_amount    DECIMAL(12, 0) NOT NULL,
  status          ENUM(
                    'PENDING',
                    'PAID',
                    'PROCESSING',
                    'SHIPPED',
                    'DELIVERED',
                    'CANCELLED'
                  ) NOT NULL DEFAULT 'PENDING',
  payment_method  VARCHAR(20) NULL,
  payment_ref     VARCHAR(100) NULL,
  order_type      ENUM('ONLINE', 'IN_STORE') NOT NULL DEFAULT 'ONLINE',
  branch_id       INT UNSIGNED NULL,
  note            TEXT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orders_number (order_number),
  KEY idx_orders_status (status),
  KEY idx_orders_phone (customer_phone),
  KEY idx_orders_created (created_at),
  KEY idx_orders_branch (branch_id),
  CONSTRAINT fk_orders_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 10: order_items
-- اقلام هر سفارش
-- نام و قیمت محصول snapshot می‌شوند
-- یعنی اگر بعدا محصول تغییر کرد، سفارش قدیمی دست‌نخورده می‌ماند
-- ==========================================
CREATE TABLE order_items (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id        INT UNSIGNED NOT NULL,
  product_id      INT UNSIGNED NOT NULL,
  variant_id      INT UNSIGNED NOT NULL,
  product_name    VARCHAR(200) NOT NULL,
  weight_gram     INT UNSIGNED NOT NULL,
  price           DECIMAL(12, 0) NOT NULL,
  quantity        INT UNSIGNED NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- جدول 9: customers
-- مشتریان فروشگاه
-- ==========================================
CREATE TABLE customers (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone             VARCHAR(15) NOT NULL,
  full_name         VARCHAR(100) NULL,
  email             VARCHAR(100) NULL,
  password_hash     VARCHAR(255) NULL,
  otp_code          VARCHAR(6) NULL,
  otp_expires_at    TIMESTAMP NULL,
  otp_attempts      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  otp_last_sent_at  TIMESTAMP NULL,
  default_address   TEXT NULL,
  admin_note        TEXT NULL,
  order_count       INT UNSIGNED NOT NULL DEFAULT 0,
  last_order_at     TIMESTAMP NULL,
  is_active         TINYINT(1) NOT NULL DEFAULT 1,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_customers_phone (phone),
  KEY idx_customers_name (full_name),
  KEY idx_customers_last_order (last_order_at),
  KEY idx_customers_active (is_active),
  KEY idx_customers_otp_expires (otp_expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


SET FOREIGN_KEY_CHECKS = 1;