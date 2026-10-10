'use client';

import { X, Heart, Send } from 'lucide-react';
import type { Episode } from '../../lib/api';
import { useEpisodeEngagement } from '../../lib/useEpisodeEngagement';
import Spinner from '../ui/Spinner';

export default function EpisodeEndPrompt({ episode, onClose }: { episode: Episode; onClose: () => void }) {
  const {
    liked, likeCount, likeBusy, toggleLike,
    commentStatus, commentError, submitComment,
  } = useEpisodeEngagement(episode);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as { author_name: string; body: string };
    await submitComment(data);
    form.reset();
  }

  return (
    <div className="absolute inset-0 z-40 bg-ink-900/90 flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 text-ink-400 hover:text-ink-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-xs uppercase tracking-wide text-signal-500 font-bold mb-1">Épisode terminé</p>
        <h3 className="font-bold text-ink-800 leading-snug mb-4 line-clamp-2">{episode.title}</h3>

        <button
          type="button"
          onClick={toggleLike}
          disabled={likeBusy}
          aria-pressed={liked}
          className={`w-full mb-4 inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
            liked
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'border-paper-300 text-ink-700 hover:border-brand-500'
          }`}
        >
          <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
          {liked ? 'Vous aimez cet épisode' : "J'aime cet épisode"}
          {likeCount > 0 ? ` · ${likeCount}` : ''}
        </button>

        {commentStatus === 'success' ? (
          <p className="text-sm text-brand-800 bg-brand-50 border border-brand-100 rounded-lg p-3">
            Merci, votre commentaire sera visible après modération.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-2">
            <input
              name="author_name"
              required
              placeholder="Votre nom"
              className="rounded-lg border border-paper-300 bg-white px-3.5 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-signal-500 focus:ring-2 focus:ring-signal-500/20"
            />
            <textarea
              name="body"
              required
              rows={2}
              placeholder="Un mot sur cet épisode…"
              className="rounded-lg border border-paper-300 bg-white px-3.5 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-signal-500 focus:ring-2 focus:ring-signal-500/20 resize-none"
            />
            {commentStatus === 'error' && <p className="text-xs text-red-600">{commentError}</p>}
            <button
              type="submit"
              disabled={commentStatus === 'submitting'}
              className="self-end inline-flex items-center gap-1.5 rounded-full bg-signal-400 text-brand-900 font-semibold px-4 py-2 text-xs hover:bg-signal-500 transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              {commentStatus === 'submitting' ? <Spinner size="sm" className="text-brand-900" /> : <Send className="h-3 w-3" />}
              Envoyer
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
