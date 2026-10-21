// app/(site)/layout.tsx
// لایوت صفحات عمومی (فروشگاه) با هدر و فوتر

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}