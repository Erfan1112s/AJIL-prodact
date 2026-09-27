// src/app/page.tsx
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

type DbStatus =
  | { ok: true; version: string; db: string }
  | { ok: false; error: string };

async function checkDb(): Promise<DbStatus> {
  try {
    const [rows] = await db.query<Array<{ version: string; db: string }>>(
      'SELECT VERSION() AS version, DATABASE() AS db'
    );
    const row = rows[0];
    if (!row) return { ok: false, error: 'نتیجه‌ای برنگشت' };
    return { ok: true, version: row.version, db: row.db };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'خطای ناشناخته',
    };
  }
}

export default async function HomePage() {
  const status = await checkDb();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold text-brand-700">
        کاتالوگ آجیل و خشکبار
      </h1>
      <p className="text-zinc-600">پروژه با موفقیت راه‌اندازی شد ✅</p>

      <div className="rounded-lg border border-zinc-200 p-5 text-sm w-full max-w-md shadow-sm">
        <div className="font-semibold mb-2">وضعیت دیتابیس:</div>
        {status.ok ? (
          <div className="text-green-700 space-y-1">
            <div>✅ اتصال برقرار است</div>
            <div className="text-xs text-zinc-500">
              MySQL نسخه: {status.version}
            </div>
            <div className="text-xs text-zinc-500">
              دیتابیس فعال: {status.db}
            </div>
          </div>
        ) : (
          <div className="text-red-700">
            <div>❌ خطا در اتصال</div>
            <pre className="mt-2 text-xs whitespace-pre-wrap bg-red-50 p-2 rounded">
              {status.error}
            </pre>
          </div>
        )}
      </div>

      <div className="text-xs text-zinc-400 text-center">
        Next.js 16 + React 19 + Tailwind 4 + MySQL
      </div>
    </main>
  );
}

// asdjklds;afj;alsdfjakdlsfjdslkjfl;dsfjd;lf