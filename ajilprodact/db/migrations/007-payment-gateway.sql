ALTER TABLE orders
  ADD COLUMN payment_gateway VARCHAR(50) NULL AFTER payment_authority,
  ADD COLUMN payment_receipt_url VARCHAR(500) NULL,
  ADD COLUMN payment_verified_by_admin TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN payment_verified_admin_id BIGINT UNSIGNED NULL,
  ADD COLUMN payment_admin_note VARCHAR(500) NULL;

CREATE INDEX idx_orders_payment_gateway ON orders(payment_gateway);

-- mariadb -u USER -p DB_NAME < db/migrations/007-payment-gateway.sql