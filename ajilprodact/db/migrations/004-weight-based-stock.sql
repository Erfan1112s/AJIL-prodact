-- db/migrations/004-weight-based-stock.sql
-- تبدیل موجودی از تعداد به وزن

SET NAMES utf8mb4;

-- 1. ساخت جدول جدید
CREATE TABLE IF NOT EXISTS product_branch_stock (
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

-- 2. انتقال داده از branch_inventory
-- هر variant.stock × weight_gram → total_weight_grams
INSERT INTO product_branch_stock (branch_id, product_id, total_weight_grams, reserved_weight_grams)
SELECT
  bi.branch_id,
  pv.product_id,
  SUM(bi.stock * pv.weight_gram) AS total_weight_grams,
  SUM(bi.reserved * pv.weight_gram) AS reserved_weight_grams
FROM branch_inventory bi
INNER JOIN product_variants pv ON pv.id = bi.variant_id
GROUP BY bi.branch_id, pv.product_id
ON DUPLICATE KEY UPDATE
  total_weight_grams = VALUES(total_weight_grams),
  reserved_weight_grams = VALUES(reserved_weight_grams);

-- 3. (اختیاری) حذف جدول قدیمی
-- DROP TABLE branch_inventory;