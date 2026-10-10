// app/checkout/page.tsx
// صفحه تسویه حساب

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';
import { queryRows } from '@/lib/db';
import Container from '@/components/Container';
import CheckoutClient from '@/components/checkout/CheckoutClient';
import type { CustomerRow, BranchRow } from '@/lib/types';

export const metadata: Metadata = {
  title: 'تسویه حساب',
  description: 'تکمیل اطلاعات و پرداخت سفارش',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const customerId = await getCurrentCustomerId();
  if (!customerId) {
    redirect('/auth/login?from=/checkout');
  }

  const customers = await queryRows<CustomerRow>(
    `SELECT id, phone, full_name, email, default_address
     FROM customers WHERE id = ? AND is_active = 1 LIMIT 1`,
    [customerId]
  );

  const customer = customers[0];
  if (!customer) {
    redirect('/auth/login');
  }

  const branches = await queryRows<BranchRow>(
    `SELECT id, name, slug, address, phone, lat, lng,
            is_active, created_at, updated_at
     FROM branches WHERE is_active = 1 ORDER BY name ASC`
  );

  return (
    <main className="min-h-screen">
      <div className="bg-cream-100 border-b border-coffee-200">
        <Container className="py-3 text-sm text-coffee-600">
          <Link href="/" className="hover:text-gold-700 transition-colors">
            خانه
          </Link>
          <span className="mx-2 text-coffee-400">/</span>
          <Link href="/cart" className="hover:text-gold-700 transition-colors">
            سبد خرید
          </Link>
          <span className="mx-2 text-coffee-400">/</span>
          <span className="text-coffee-900">تسویه حساب</span>
        </Container>
      </div>

      <section className="bg-gradient-to-b from-gold-50/60 to-cream-50 border-b border-coffee-100">
        <Container className="py-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-gold-400 to-gold-700" />
            <h1 className="text-2xl font-bold text-coffee-900">
              تسویه حساب
            </h1>
          </div>
        </Container>
      </section>

      <Container className="py-8 pb-16">
        <CheckoutClient
          customer={{
            phone: customer.phone,
            fullName: customer.full_name ?? '',
            email: customer.email ?? '',
            defaultAddress: customer.default_address ?? '',
          }}
          branches={branches.map((b) => ({
            id: b.id,
            name: b.name,
            address: b.address,
            phone: b.phone,
          }))}
        />
      </Container>
    </main>
  );
}