// app/admin/actions.ts
// Server Action های عمومی پنل ادمین

'use server';

import { redirect } from 'next/navigation';
import { clearSessionCookie } from '@/lib/auth/session';

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/admin/login');
}