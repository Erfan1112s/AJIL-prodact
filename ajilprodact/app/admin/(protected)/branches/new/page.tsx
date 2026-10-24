// app/admin/branches/new/page.tsx
// افزودن شعبه جدید

import type { Metadata } from 'next';
import BranchForm from '@/components/admin/branches/BranchForm';

export const metadata: Metadata = {
  title: 'افزودن شعبه',
  robots: { index: false, follow: false },
};

export default function NewBranchPage() {
  return <BranchForm />;
}