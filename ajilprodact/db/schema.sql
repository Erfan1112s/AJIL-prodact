-- db/schema.sql
-- اسکیمای کامل پروژه کاتالوگ آجیل و خشکبار
-- 19 جدول (14 جدول قبلی + 5 جدول احراز هویت یکپارچه)
-- اجرا: mariadb -u root ajil_catalog < db/schema.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- حذف جدول‌ها (ترتیب: فرزندان قبل از والدین)
-- ==========================================
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

DROP TABLE IF EXISTS review_votes;
DROP TABLE IF EXISTS review_media;
DROP TABLE IF EXISTS product_reviews;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_branch_stock;
DROP TABLE IF EXISTS batches;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS admin_users;

SET FOREIGN_KEY_CHECKS = 1;


-- ==========================================
-- جدول 1: admin_users (بدون وابستگی)
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
-- جدول 2: customers (بدون وابستگی)
-- ==========================================
CREATE TABLE customers (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone             VARCHAR(15) NOT NULL,
  national_code     VARCHAR(10) NULL,
  full_name         VARCHAR(100) NULL,
  email             VARCHAR(100) NULL,
  password_hash     VARCHAR(255) NULL,
  otp_code          VARCHAR(6) NULL,
  otp_expires_at    TIMESTAMP NULL,
  otp_attempts      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  otp_last_sent_at  TIMESTAMP NULL,
  otp_verified_at   TIMESTAMP NULL,
  default_address   TEXT NULL,
  admin_note        TEXT NULL,
  order_count       INT UNSIGNED NOT NULL DEFAULT 0,
  last_order_at     TIMESTAMP NULL,
  is_active         TINYINT(1) NOT NULL DEFAULT 1,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_customers_phone (phone),
  KEY idx_customers_national (national_code),
  KEY idx_customers_name (full_name),
  KEY idx_customers_last_order (last_order_at),
  KEY idx_customers_active (is_active),
  KEY idx_customers_otp_expires (otp_expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 3: roles (بدون وابستگی)
-- ==========================================
CREATE TABLE roles (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description  TEXT NULL,
  is_system    TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 4: permissions (بدون وابستگی)
-- ==========================================
CREATE TABLE permissions (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  permission_key VARCHAR(100) NOT NULL,
  display_name   VARCHAR(150) NOT NULL,
  group_name     VARCHAR(50) NOT NULL,
  description    VARCHAR(255) NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_permissions_key (permission_key),
  KEY idx_permissions_group (group_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 5: role_permissions
-- ==========================================
CREATE TABLE role_permissions (
  role_id       INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  KEY idx_role_permissions_perm (permission_id),
  CONSTRAINT fk_role_permissions_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_role_permissions_perm
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 6: users (وابسته به roles, customers, admin_users)
-- ==========================================
CREATE TABLE users (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone               VARCHAR(15) NULL,
  username            VARCHAR(50) NULL,
  email               VARCHAR(100) NULL,
  password_hash       VARCHAR(255) NULL,
  full_name           VARCHAR(100) NULL,
  national_code       VARCHAR(10) NULL,
  user_type           ENUM('CUSTOMER', 'STAFF') NOT NULL DEFAULT 'CUSTOMER',
  role_id             INT UNSIGNED NOT NULL,
  customer_id         INT UNSIGNED NULL,
  staff_id            INT UNSIGNED NULL,
  is_active           TINYINT(1) NOT NULL DEFAULT 1,
  is_locked           TINYINT(1) NOT NULL DEFAULT 0,
  failed_login_count  INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until        TIMESTAMP NULL,
  last_login_at       TIMESTAMP NULL,
  last_login_ip       VARCHAR(45) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_phone (phone),
  UNIQUE KEY uk_users_username (username),
  KEY idx_users_role (role_id),
  KEY idx_users_type (user_type),
  KEY idx_users_customer (customer_id),
  KEY idx_users_staff (staff_id),
  KEY idx_users_active (is_active),
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_users_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_users_staff
    FOREIGN KEY (staff_id) REFERENCES admin_users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 7: user_sessions (وابسته به users)
-- ==========================================
CREATE TABLE user_sessions (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED NOT NULL,
  token_hash     VARCHAR(128) NOT NULL,
  ip_address     VARCHAR(45) NULL,
  user_agent     VARCHAR(500) NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at     TIMESTAMP NOT NULL,
  revoked_at     TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_sessions_token (token_hash),
  KEY idx_user_sessions_user (user_id),
  KEY idx_user_sessions_expires (expires_at),
  CONSTRAINT fk_user_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 8: categories (self-ref)
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
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 9: branches (بدون وابستگی)
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
-- جدول 10: products (وابسته به categories)
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
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 11: product_variants (وابسته به products)
-- ==========================================
CREATE TABLE product_variants (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id       INT UNSIGNED NOT NULL,
  weight_gram      INT UNSIGNED NOT NULL,
  packaging_type   VARCHAR(50) NOT NULL DEFAULT 'standard',
  packaging_label  VARCHAR(100) NULL,
  price            DECIMAL(12, 0) NOT NULL,
  compare_price    DECIMAL(12, 0) NULL,
  sku              VARCHAR(50) NULL,
  image_url        VARCHAR(500) NULL,
  is_active        TINYINT(1) NOT NULL DEFAULT 1,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_variants_sku (sku),
  UNIQUE KEY uk_variants_product_weight_packaging
    (product_id, weight_gram, packaging_type),
  KEY idx_variants_product_active (product_id, is_active),
  KEY idx_variants_weight (weight_gram),
  CONSTRAINT fk_variants_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 12: product_images (وابسته به products)
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
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 13: batches (وابسته به products)
-- ==========================================
CREATE TABLE batches (
  id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  batch_code             VARCHAR(30) NOT NULL,
  product_id             INT UNSIGNED NOT NULL,
  supplier_name          VARCHAR(150) NULL,
  harvest_date           DATE NULL,
  roast_date             DATE NULL,
  pack_date              DATE NULL,
  expiry_date            DATE NULL,
  freshness_mode         ENUM('MANUAL', 'AUTO') NOT NULL DEFAULT 'MANUAL',
  freshness_score        TINYINT UNSIGNED NOT NULL DEFAULT 100,
  freshness_base_score   TINYINT UNSIGNED NOT NULL DEFAULT 100,
  freshness_base_date    DATE NULL,
  freshness_annual_decay TINYINT UNSIGNED NOT NULL DEFAULT 50,
  qc_note                TEXT NULL,
  is_active              TINYINT(1) NOT NULL DEFAULT 1,
  created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_batches_code (batch_code),
  KEY idx_batches_product (product_id),
  KEY idx_batches_freshness (freshness_score),
  CONSTRAINT fk_batches_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 14: product_branch_stock (وابسته به branches, products)
-- ==========================================
CREATE TABLE product_branch_stock (
  id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id              INT UNSIGNED NOT NULL,
  product_id             INT UNSIGNED NOT NULL,
  total_weight_grams     INT NOT NULL DEFAULT 0,
  reserved_weight_grams  INT NOT NULL DEFAULT 0,
  updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_product_branch_stock (branch_id, product_id),
  KEY idx_product_branch_stock_product (product_id),
  CONSTRAINT fk_product_branch_stock_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_product_branch_stock_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 15: orders (وابسته به customers, branches)
-- ==========================================
CREATE TABLE orders (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number          VARCHAR(20) NOT NULL,
  customer_id           INT UNSIGNED NULL,
  customer_name         VARCHAR(100) NOT NULL,
  customer_phone        VARCHAR(15) NOT NULL,
  customer_email        VARCHAR(100) NULL,
  province              VARCHAR(100) NULL,
  city                  VARCHAR(100) NULL,
  address               TEXT NULL,
  postal_code           VARCHAR(10) NULL,
  subtotal              DECIMAL(12, 0) NOT NULL DEFAULT 0,
  shipping_cost         DECIMAL(12, 0) NOT NULL DEFAULT 0,
  total_amount          DECIMAL(12, 0) NOT NULL,
  status                ENUM(
                          'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'
                        ) NOT NULL DEFAULT 'PENDING',
  delivery_method       ENUM('SHIPPING', 'PICKUP') NOT NULL DEFAULT 'SHIPPING',
  shipping_provider     ENUM('SNAPP', 'POST', 'NONE') NOT NULL DEFAULT 'NONE',
  payment_method        VARCHAR(20) NULL,
  payment_ref           VARCHAR(100) NULL,
  payment_authority     VARCHAR(100) NULL,
  payment_verified_at   TIMESTAMP NULL,
  branch_id             INT UNSIGNED NULL,
  tracking_code         VARCHAR(50) NULL,
  note                  TEXT NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orders_number (order_number),
  KEY idx_orders_status (status),
  KEY idx_orders_customer (customer_id),
  KEY idx_orders_phone (customer_phone),
  KEY idx_orders_created (created_at),
  KEY idx_orders_branch (branch_id),
  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_orders_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 16: order_items (وابسته به orders, products, product_variants)
-- ==========================================
CREATE TABLE order_items (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id          INT UNSIGNED NOT NULL,
  product_id        INT UNSIGNED NOT NULL,
  variant_id        INT UNSIGNED NOT NULL,
  product_name      VARCHAR(200) NOT NULL,
  weight_gram       INT UNSIGNED NOT NULL,
  packaging_type    VARCHAR(50) NOT NULL DEFAULT 'standard',
  packaging_label   VARCHAR(100) NULL,
  price             DECIMAL(12, 0) NOT NULL,
  quantity          INT UNSIGNED NOT NULL DEFAULT 1,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 17: product_reviews (وابسته به products, customers)
-- ==========================================
CREATE TABLE product_reviews (
  id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id             INT UNSIGNED NOT NULL,
  customer_id            INT UNSIGNED NOT NULL,
  rating                 TINYINT UNSIGNED NOT NULL,
  title                  VARCHAR(100) NULL,
  body                   TEXT NULL,
  is_verified_purchase   TINYINT(1) NOT NULL DEFAULT 0,
  is_approved            TINYINT(1) NOT NULL DEFAULT 0,
  approved_at            TIMESTAMP NULL,
  admin_reply            TEXT NULL,
  admin_reply_at         TIMESTAMP NULL,
  helpful_count          INT UNSIGNED NOT NULL DEFAULT 0,
  created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_review_customer_product (customer_id, product_id),
  KEY idx_reviews_product_approved (product_id, is_approved),
  KEY idx_reviews_approved_created (is_approved, created_at),
  KEY idx_reviews_customer (customer_id),
  KEY idx_reviews_rating (rating),
  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 18: review_media (وابسته به product_reviews)
-- ==========================================
CREATE TABLE review_media (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  review_id      INT UNSIGNED NOT NULL,
  media_type     ENUM('IMAGE', 'VIDEO') NOT NULL DEFAULT 'IMAGE',
  url            VARCHAR(500) NOT NULL,
  thumbnail_url  VARCHAR(500) NULL,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_review_media_review (review_id, sort_order),
  CONSTRAINT fk_review_media_review
    FOREIGN KEY (review_id) REFERENCES product_reviews(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 19: review_votes (وابسته به product_reviews, customers)
-- ==========================================
CREATE TABLE review_votes (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  review_id    INT UNSIGNED NOT NULL,
  customer_id  INT UNSIGNED NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_review_vote (review_id, customer_id),
  KEY idx_review_votes_review (review_id),
  KEY idx_review_votes_customer (customer_id),
  CONSTRAINT fk_review_votes_review
    FOREIGN KEY (review_id) REFERENCES product_reviews(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_review_votes_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;