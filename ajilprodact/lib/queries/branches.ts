// lib/queries/branches.ts
import { queryRows } from '@/lib/db';
import type { BranchRow, VariantBranchStock } from '@/lib/types';

export async function getActiveBranches(): Promise<BranchRow[]> {
  const rows = await queryRows<BranchRow>(
    `SELECT id, name, slug, address, phone, lat, lng,
            is_active, created_at, updated_at
     FROM branches
     WHERE is_active = 1
     ORDER BY name ASC`
  );
  return rows;
}

export async function getBranchBySlug(slug: string): Promise<BranchRow | null> {
  const rows = await queryRows<BranchRow>(
    `SELECT id, name, slug, address, phone, lat, lng,
            is_active, created_at, updated_at
     FROM branches
     WHERE slug = ? AND is_active = 1
     LIMIT 1`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function getVariantAvailability(
  variantId: number
): Promise<VariantBranchStock[]> {
  const rows = await queryRows<{
    branch_id: number;
    branch_name: string;
    branch_slug: string;
    branch_address: string | null;
    branch_phone: string | null;
    stock: number;
    reserved: number;
  }>(
    `SELECT b.id AS branch_id,
            b.name AS branch_name,
            b.slug AS branch_slug,
            b.address AS branch_address,
            b.phone AS branch_phone,
            COALESCE(bi.stock, 0) AS stock,
            COALESCE(bi.reserved, 0) AS reserved
     FROM branches b
     LEFT JOIN branch_inventory bi
       ON bi.branch_id = b.id AND bi.variant_id = ?
     WHERE b.is_active = 1
     ORDER BY b.name ASC`,
    [variantId]
  );

  return rows.map((row) => ({
    branch_id: row.branch_id,
    branch_name: row.branch_name,
    branch_slug: row.branch_slug,
    branch_address: row.branch_address,
    branch_phone: row.branch_phone,
    stock: row.stock,
    reserved: row.reserved,
    available: row.stock - row.reserved,
  }));
}

export async function getTotalStockForVariant(variantId: number): Promise<number> {
  const rows = await queryRows<{ total: number }>(
    `SELECT COALESCE(SUM(stock - reserved), 0) AS total
     FROM branch_inventory
     WHERE variant_id = ?`,
    [variantId]
  );
  return rows[0]?.total ?? 0;
}