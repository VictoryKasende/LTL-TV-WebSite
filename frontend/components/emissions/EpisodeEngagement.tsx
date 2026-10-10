'use client';

import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Send } from 'lucide-react';
import type { Episode, EpisodeComment } from '../../lib/api';
import Spinner from '../ui/Spinner';

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Il y a 1 jour';
  if (days < 30) return `Il y a ${days} jours`;
  const months = Math.floor(days / 30);
  return months <= 1 ? 'Il y a 1 mois' : `Il y a ${months} mois`;
}

type CommentStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function EpisodeEngagement({ episode }: { episode: Episode }) {
  const likeKey = `liked:episode:${episode.slug}`;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(episode.like_count);
  const [likeBusy, setLikeBusy] = useState(false);

  const [comments, setComments] = useState<EpisodeComment[] | null>(null);
  const [commentStatus, setCommentStatus] = useState<CommentStatus>('idle');
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    setLiked(typeof window !== 'undefined' && window.localStorage.getItem(likeKey) === '1');
  }, [likeKey]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/emissions/episodes/${episode.slug}/comments/`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled) setComments(data?.results ?? []); })
      .catch(() => { if (!cancelled) setComments([]); });
    return () => { cancelled = true; };
  }, [episode.slug]);

  async function toggleLike() {
    if (likeBusy) return;
    setLikeBusy(true);
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      const res = await fetch(`/api/v1/emissions/episodes/${episode.slug}/${next ? 'like' : 'unlike'}/`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setLikeCount(data.like_count);
        window.localStorage.setItem(likeKey, next ? '1' : '0');
      } else {
        // Roll back on failure (throttled, network error…).
        setLiked(!next);
        setLikeCount((c) => c - (next ? 1 : -1));
      }
    } catch {
      setLiked(!next);
      setLikeCount((c) => c - (next ? 1 : -1));
    } finally {
      setLikeBusy(false);
    }
  }

  async function onSubmitComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCommentStatus('submitting');
    setCommentError('');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch(`/api/v1/emissions/episodes/${episode.slug}/comments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Une erreur est survenue.');
      }
      setCommentStatus('success');
      form.reset();
    } catch (err) {
      setCommentStatus('error');
      setCommentError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  return (
    <section className="bg-white px-4 sm:px-6 md:px-10 py-8 sm:py-10 border-t border-paper-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={toggleLike}
            disabled={likeBusy}
            aria-pressed={liked}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              liked
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'border-paper-300 text-ink-700 hover:border-brand-500'
            }`}
          >
            <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
            {likeCount > 0 ? likeCount : "J'aime"}
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-500">
            <MessageCircle className="h-4 w-4" />
            {comments === null ? '…' : comments.length} commentaire{(comments?.length ?? 0) > 1 ? 's' : ''}
          </span>
        </div>

        {commentStatus === 'success' ? (
          <div className="rounded-xl bg-brand-50 border border-brand-100 p-5 text-sm text-brand-800 mb-8">
            Merci, votre commentaire sera visible après modération.
          </div>
        ) : (
          <form onSubmit={onSubmitComment} className="mb-8 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-3">
              <input
                name="author_name"
                required
                placeholder="Votre nom"
                className="rounded-lg border border-paper-300 bg-white px-4 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-signal-500 focus:ring-2 focus:ring-signal-500/20"
              />
              <input
                name="body"
                required
                placeholder="Votre commentaire…"
                className="rounded-lg border border-paper-300 bg-white px-4 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-signal-500 focus:ring-2 focus:ring-signal-500/20"
              />
            </div>
            {commentStatus === 'error' && (
              <p className="text-sm text-red-600">{commentError}</p>
            )}
            <button
              type="submit"
              disabled={commentStatus === 'submitting'}
              className="self-start inline-flex items-center gap-2 rounded-full bg-signal-400 text-brand-900 font-semibold px-5 py-2.5 text-sm hover:bg-signal-500 transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              {commentStatus === 'submitting' ? <Spinner size="sm" className="text-brand-900" /> : <Send className="h-3.5 w-3.5" />}
              Envoyer
            </button>
          </form>
        )}

        {comments === null ? (
          <div className="flex items-center gap-2 text-sm text-ink-500 py-4">
            <Spinner size="sm" className="text-brand-500" />
            Chargement des commentaires…
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-ink-500">Soyez le premier à commenter cet épisode.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-paper-200">
            {comments.map((c) => (
              <li key={c.id} className="py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-ink-800">{c.author_name}</span>
                  <span className="text-xs text-ink-400">{relativeTime(c.created_at)}</span>
                </div>
                <p className="text-sm text-ink-700 leading-relaxed">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
