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

  // محصولات کم‌موجود (موجودی کل زیر 5)
  const lowStockRows = await queryRows<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM (
       SELECT pv.id
       FROM product_variants pv
       LEFT JOIN branch_inventory bi ON bi.variant_id = pv.id
       WHERE pv.is_active = 1
       GROUP BY pv.id
       HAVING COALESCE(SUM(bi.stock - bi.reserved), 0) < 5
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
  // خواندن فروش ۷ روز اخیر (از ۶ روز قبل تا امروز)
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

  // ساخت نقشه از تاریخ به ردیف
  const byDate = new Map<string, { revenue: number; cnt: number }>();
  for (const row of rows) {
    const key = String(row.date).slice(0, 10);
    byDate.set(key, {
      revenue: Number(row.revenue),
      cnt: Number(row.cnt),
    });
  }

  // روزهای هفته
  const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

  // پر کردن ۷ روز (حتی روزهای بدون فروش)
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
// محصولات کم‌موجود
// ==========================================

export interface LowStockProduct {
  variant_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  weight_gram: number;
  stock_total: number;
}

export async function getLowStockProducts(limit = 5): Promise<LowStockProduct[]> {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 20);

  const rows = await queryRows<LowStockProduct>(
    `SELECT
       pv.id AS variant_id,
       p.id AS product_id,
       p.name AS product_name,
       p.slug AS product_slug,
       pv.weight_gram,
       COALESCE(SUM(bi.stock - bi.reserved), 0) AS stock_total
     FROM product_variants pv
     INNER JOIN products p ON p.id = pv.product_id
     LEFT JOIN branch_inventory bi ON bi.variant_id = pv.id
     WHERE pv.is_active = 1 AND p.is_active = 1
     GROUP BY pv.id, p.id, p.name, p.slug, pv.weight_gram
     HAVING stock_total < 5
     ORDER BY stock_total ASC, p.name ASC
     LIMIT ${safeLimit}`
  );
  return rows;
}