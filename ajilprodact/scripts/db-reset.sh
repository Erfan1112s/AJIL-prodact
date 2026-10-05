#!/bin/bash
# scripts/db-reset.sh
# بازسازی کامل دیتابیس از صفر
# استفاده: ./scripts/db-reset.sh

# chmod +x scripts/db-reset.sh
# ./scripts/db-reset.sh

set -e

DB_NAME="ajil_catalog"
DB_USER="root"

echo "مرحله ۱: حذف دیتابیس"
mariadb -u "$DB_USER" -e "DROP DATABASE IF EXISTS $DB_NAME;"

echo "مرحله ۲: ساخت دیتابیس"
mariadb -u "$DB_USER" -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "مرحله ۳: اجرای schema"
mariadb -u "$DB_USER" "$DB_NAME" < db/schema.sql

echo "مرحله ۴: اجرای seed"
mariadb -u "$DB_USER" "$DB_NAME" < db/seed.sql

echo "مرحله ۵: بررسی نهایی"
mariadb -u "$DB_USER" "$DB_NAME" -e "
SELECT
  (SELECT COUNT(*) FROM categories) AS categories,
  (SELECT COUNT(*) FROM products) AS products,
  (SELECT COUNT(*) FROM product_variants) AS variants,
  (SELECT COUNT(*) FROM branches) AS branches,
  (SELECT COUNT(*) FROM branch_inventory) AS inventory,
  (SELECT COUNT(*) FROM customers) AS customers,
  (SELECT COUNT(*) FROM admin_users) AS admins;
"

echo "بازسازی کامل شد."