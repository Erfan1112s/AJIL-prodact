-- db/migrations/005-reviews.sql
-- افزودن جداول نظرات کاربران
-- اجرا روی دیتابیس موجود، بدون حذف داده‌های قبلی

SET NAMES utf8mb4;

-- ==========================================
-- جدول 1: product_reviews
-- نظرات کاربران برای هر محصول
-- ==========================================
CREATE TABLE product_reviews (
  id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- ارتباط
  product_id             INT UNSIGNED NOT NULL,
  customer_id            INT UNSIGNED NOT NULL,

  -- محتوا
  rating                 TINYINT UNSIGNED NOT NULL,
  title                  VARCHAR(100) NULL,
  body                   TEXT NULL,

  -- وضعیت
  is_verified_purchase   TINYINT(1) NOT NULL DEFAULT 0,
  is_approved            TINYINT(1) NOT NULL DEFAULT 0,
  approved_at            TIMESTAMP NULL,

  -- پاسخ ادمین
  admin_reply            TEXT NULL,
  admin_reply_at         TIMESTAMP NULL,

  -- رأی مفید
  helpful_count          INT UNSIGNED NOT NULL DEFAULT 0,

  -- زمان‌ها
  created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- یک نظر به ازای هر مشتری برای هر محصول
  UNIQUE KEY uk_review_customer_product (customer_id, product_id),

  -- ایندکس‌ها
  KEY idx_reviews_product_approved (product_id, is_approved),
  KEY idx_reviews_approved_created (is_approved, created_at),
  KEY idx_reviews_customer (customer_id),
  KEY idx_reviews_rating (rating),

  -- کلیدهای خارجی
  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 2: review_media
-- عکس و ویدیوهای هر نظر
-- ==========================================
CREATE TABLE review_media (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- ارتباط
  review_id      INT UNSIGNED NOT NULL,

  -- محتوا
  media_type     ENUM('IMAGE', 'VIDEO') NOT NULL DEFAULT 'IMAGE',
  url            VARCHAR(500) NOT NULL,
  thumbnail_url  VARCHAR(500) NULL,
  sort_order     INT NOT NULL DEFAULT 0,

  -- زمان
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_review_media_review (review_id, sort_order),

  CONSTRAINT fk_review_media_review
    FOREIGN KEY (review_id) REFERENCES product_reviews(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- جدول 3: review_votes
-- رأی «مفید بود» کاربران
-- ==========================================
CREATE TABLE review_votes (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- ارتباط
  review_id    INT UNSIGNED NOT NULL,
  customer_id  INT UNSIGNED NOT NULL,

  -- زمان
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- هر کاربر فقط یک بار می‌تواند به یک نظر رأی بدهد
  UNIQUE KEY uk_review_vote (review_id, customer_id),

  KEY idx_review_votes_review (review_id),
  KEY idx_review_votes_customer (customer_id),

  CONSTRAINT fk_review_votes_review
    FOREIGN KEY (review_id) REFERENCES product_reviews(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_review_votes_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;