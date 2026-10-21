// components/reviews/HelpfulButton.tsx
// دکمه «مفید بود» با Optimistic UI

'use client';

import { useState, useTransition } from 'react';
import { voteHelpfulAction } from '@/app/(site)/products/[slug]/reviews/actions';

interface Props {
  reviewId: number;
  productSlug: string;
  initialHasVoted: boolean;
  initialCount: number;
}

export default function HelpfulButton({
  reviewId,
  productSlug,
  initialHasVoted,
  initialCount,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (isPending) return;

    const nextVoted = !hasVoted;
    const nextCount = nextVoted ? count + 1 : Math.max(0, count - 1);

    setHasVoted(nextVoted);
    setCount(nextCount);
    setError(null);

    startTransition(async () => {
      const result = await voteHelpfulAction(reviewId, productSlug);

      if (result.ok) {
        setHasVoted(result.hasVoted);
        setCount(result.newCount);
      } else {
        setHasVoted(!nextVoted);
        setCount(count);
        setError(result.error);
        setTimeout(() => setError(null), 3000);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          hasVoted
            ? 'bg-gold-50 text-gold-700 border border-gold-300'
            : 'bg-white text-coffee-600 border border-coffee-200 hover:border-gold-400 hover:text-gold-700'
        } disabled:opacity-60`}
        aria-pressed={hasVoted}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={hasVoted ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={hasVoted ? 0 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 22V11M7 11l4-8a2 2 0 0 1 3.5 1.3V9h4.5a2 2 0 0 1 2 2.4l-1.5 8A2 2 0 0 1 17.5 21H7" />
        </svg>
        مفید بود
        {count > 0 && (
          <span
            className={`min-w-[18px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold fa-num ${
              hasVoted
                ? 'bg-gold-500 text-coffee-900'
                : 'bg-cream-200 text-coffee-600'
            }`}
          >
            {count.toLocaleString('fa-IR')}
          </span>
        )}
      </button>

      {error && (
        <span className="text-[10px] text-red-600">{error}</span>
      )}
    </div>
  );
}