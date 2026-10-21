// lib/queries/dashboard.ts
// توابع آماری پنل ادمین

import { queryRows } from '@/lib/db';

// ==========================================
// آمار کلی
// ==========================================

export interface DashboardStats {
  // امروز
  revenueToday: number;
  ordersToday: number;
  newCustomersToday: number;

  // دیروز (برای مقایسه)
  revenueYesterday: number;
  ordersYesterday: number;
  newCustomersYesterday: number;

  // کلی
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;

  // در انتظار رسیدگی
  pendingOrders: number;
  processingOrders: number;
  lowStockCount: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // فروش امروز
  const revenueTodayRows = await queryRows<{ total: number; cnt: number }>(
    `SELECT
       COALESCE(SUM(total_amount), 0) AS total,
       COUNT(*) AS cnt
     FROM orders
     WHERE status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
       AND DATE(created_at) = CURDATE()`
  );
  const revenueToday = Number(revenueTodayRows[0]?.total ?? 0);
  const ordersToday = Number(revenueTodayRows[0]?.cnt ?? 0);

  // فروش دیروز
  const revenueYesterdayRows = await queryRows<{ total: number; cnt: number }>(
    `SELECT
       COALESCE(SUM(total_amount), 0) AS total,
       COUNT(*) AS cnt
     FROM orders
     WHERE status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
       AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
  );
  const revenueYesterday = Number(revenueYesterdayRows[0]?.total ?? 0);
  const ordersYesterday = Number(revenueYesterdayRows[0]?.cnt ?? 0);

  // مشتریان جدید امروز
  const customersTodayRows = await queryRows<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM customers
     WHERE DATE(created_at) = CURDATE()`
  );
  const newCustomersToday = Number(customersTodayRows[0]?.cnt ?? 0);

  // مشتریان جدید دیروز
  const customersYesterdayRows = await queryRows<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM customers
     WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
  );
  const newCustomersYesterday = Number(customersYesterdayRows[0]?.cnt ?? 0);

  // آمار کلی
  const totalsRows = await queryRows<{
    total_revenue: number;
    total_orders: number;
    total_customers: number;
    total_products: number;
    pending: number;
    processing: number;
  }>(
    `SELECT
       (SELECT COALESCE(SUM(total_amount), 0) FROM orders
        WHERE status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')) AS total_revenue,
       (SELECT COUNT(*) FROM orders) AS total_orders,
       (SELECT COUNT(*) FROM customers WHERE is_active = 1) AS total_customers,
       (SELECT COUNT(*) FROM products WHERE is_active = 1) AS total_products,
       (SELECT COUNT(*) FROM orders WHERE status = 'PENDING') AS pending,
       (SELECT COUNT(*) FROM orders WHERE status = 'PROCESSING') AS processing`
  );

  const totals = totalsRows[0];

  // محصولات کم‌موجود (بر اساس وزن)
  // تعریف: محصولاتی که available_weight_grams بین 1 تا 5000 گرم است
  const lowStockRows = await queryRows<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM (
       SELECT p.id
       FROM products p
       LEFT JOIN product_branch_stock pbs ON pbs.product_id = p.id
       WHERE p.is_active = 1
       GROUP BY p.id
       HAVING COALESCE(SUM(pbs.total_weight_grams - pbs.reserved_weight_grams), 0) > 0
          AND COALESCE(SUM(pbs.total_weight_grams - pbs.reserved_weight_grams), 0) < 5000
     ) AS low_stock`
  );

  return {
    revenueToday,
    ordersToday,
    newCustomersToday,
    revenueYesterday,
    ordersYesterday,
    newCustomersYesterday,
    totalRevenue: Number(totals?.total_revenue ?? 0),
    totalOrders: Number(totals?.total_orders ?? 0),
    totalCustomers: Number(totals?.total_customers ?? 0),
    totalProducts: Number(totals?.total_products ?? 0),
    pendingOrders: Number(totals?.pending ?? 0),
    processingOrders: Number(totals?.processing ?? 0),
    lowStockCount: Number(lowStockRows[0]?.cnt ?? 0),
  };
}

// ==========================================
// نمودار فروش ۷ روز اخیر
// ==========================================

export interface SalesPoint {
  date: string;
  dayLabel: string;
  revenue: number;
  ordersCount: number;
}

export async function getSalesLast7Days(): Promise<SalesPoint[]> {
  const rows = await queryRows<{
    date: string;
    revenue: number;
    cnt: number;
  }>(
    `SELECT
       DATE(created_at) AS date,
       COALESCE(SUM(total_amount), 0) AS revenue,
       COUNT(*) AS cnt
     FROM orders
     WHERE status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
       AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(created_at)
     ORDER BY DATE(created_at) ASC`
  );

  const byDate = new Map<string, { revenue: number; cnt: number }>();
  for (const row of rows) {
    const key = String(row.date).slice(0, 10);
    byDate.set(key, {
      revenue: Number(row.revenue),
      cnt: Number(row.cnt),
    });
  }

  const dayNames = [
    'یکشنبه',
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنجشنبه',
    'جمعه',
    'شنبه',
  ];

  const result: SalesPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const data = byDate.get(dateStr);

    result.push({
      date: dateStr,
      dayLabel: dayNames[d.getDay()],
      revenue: data?.revenue ?? 0,
      ordersCount: data?.cnt ?? 0,
    });
  }

  return result;
}

// ==========================================
// آخرین سفارشات
// ==========================================

export interface RecentOrder {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: Date;
}

export async function getRecentOrders(limit = 5): Promise<RecentOrder[]> {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 20);

  const rows = await queryRows<RecentOrder>(
    `SELECT id, order_number, customer_name, total_amount, status, created_at
     FROM orders
     ORDER BY created_at DESC
     LIMIT ${safeLimit}`
  );
  return rows;
}

// ==========================================
// محصولات کم‌موجود (بر اساس وزن)
// ==========================================

export interface LowStockProduct {
  product_id: number;
  product_name: string;
  product_slug: string;
  category_name: string;
  total_weight_grams: number;
  reserved_weight_grams: number;
  available_weight_grams: number;
  variants_count: number;
  image_url: string | null;
}

export async function getLowStockProducts(
  limit = 5
): Promise<LowStockProduct[]> {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 20);

  const rows = await queryRows<{
    product_id: number;
    product_name: string;
    product_slug: string;
    category_name: string;
    total_weight_grams: number;
    reserved_weight_grams: number;
    variants_count: number;
    image_url: string | null;
  }>(
    `SELECT
       p.id AS product_id,
       p.name AS product_name,
       p.slug AS product_slug,
       c.name AS category_name,
       COALESCE(SUM(pbs.total_weight_grams), 0) AS total_weight_grams,
       COALESCE(SUM(pbs.reserved_weight_grams), 0) AS reserved_weight_grams,
       (SELECT COUNT(*) FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.is_active = 1) AS variants_count,
       (SELECT url FROM product_images
        WHERE product_id = p.id
        ORDER BY is_primary DESC, sort_order ASC
        LIMIT 1) AS image_url
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN product_branch_stock pbs ON pbs.product_id = p.id
     WHERE p.is_active = 1
     GROUP BY p.id, p.name, p.slug, c.name
     HAVING COALESCE(SUM(pbs.total_weight_grams - pbs.reserved_weight_grams), 0) < 5000
     ORDER BY
       COALESCE(SUM(pbs.total_weight_grams - pbs.reserved_weight_grams), 0) ASC,
       p.name ASC
     LIMIT ${safeLimit}`
  );

  return rows.map((r) => ({
    product_id: Number(r.product_id),
    product_name: r.product_name,
    product_slug: r.product_slug,
    category_name: r.category_name,
    total_weight_grams: Number(r.total_weight_grams),
    reserved_weight_grams: Number(r.reserved_weight_grams),
    available_weight_grams: Math.max(
      0,
      Number(r.total_weight_grams) - Number(r.reserved_weight_grams)
    ),
    variants_count: Number(r.variants_count),
    image_url: r.image_url,
  }));
}