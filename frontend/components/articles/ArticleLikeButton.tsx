'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

/** Same like toggle as on episodes: optimistic, remembered per browser
 *  (localStorage), rolled back if the API refuses. */
export default function ArticleLikeButton({ slug, initialCount }: { slug: string; initialCount: number }) {
  const likeKey = `liked:article:${slug}`;
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try { setLiked(window.localStorage.getItem(likeKey) === '1'); } catch { /* storage blocked */ }
  }, [likeKey]);

  async function toggleLike() {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      const res = await fetch(`/api/v1/articles/${slug}/${next ? 'like' : 'unlike'}/`, { method: 'POST' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setLikeCount(data.like_count);
      try { window.localStorage.setItem(likeKey, next ? '1' : '0'); } catch { /* storage blocked */ }
    } catch {
      setLiked(!next);
      setLikeCount((c) => c - (next ? 1 : -1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-sm text-ink-500">Cet article vous a édifié ?</p>
      <button
        type="button"
        onClick={toggleLike}
        disabled={busy}
        aria-pressed={liked}
        className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
          liked
            ? 'bg-red-50 border-red-200 text-red-600'
            : 'border-paper-300 text-ink-700 hover:border-brand-500'
        }`}
      >
        <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
        {likeCount > 0 ? likeCount : "J'aime"}
      </button>
    </div>
  );
}
