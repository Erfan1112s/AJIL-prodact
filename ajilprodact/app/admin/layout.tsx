// app/admin/layout.tsx
// لایوت پنل ادمین

import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { queryRows } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth/session';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

interface AdminUserRow {
  id: number;
  username: string;
  full_name: string | null;
  is_active: number;
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // خواندن session ادمین
  const adminId = await getCurrentUserId();

  // اگر لاگین نیست، به صفحه لاگین برو
  if (!adminId) {
    redirect('/admin/login');
  }

  // خواندن اطلاعات ادمین
  const admins = await queryRows<AdminUserRow>(
    `SELECT id, username, full_name, is_active
     FROM admin_users
     WHERE id = ? AND is_active = 1
     LIMIT 1`,
    [adminId]
  );

  const admin = admins[0];

  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* سایدبار سمت راست */}
      <AdminSidebar />

      {/* محتوای اصلی - با فاصله از سایدبار در دسکتاپ */}
      <div className="lg:mr-64">
        <AdminHeader
          admin={{
            fullName: admin.full_name,
            username: admin.username,
          }}
        />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}