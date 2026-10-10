'use client';

import { useEffect, useState } from 'react';
import type { Episode } from './api';

export type CommentFormStatus = 'idle' | 'submitting' | 'success' | 'error';

/** Like-toggle + comment-submission state for one episode, shared between
 * the inline engagement block and the end-of-episode prompt so both stay
 * in sync and neither duplicates the fetch logic. */
export function useEpisodeEngagement(episode: Episode) {
  const likeKey = `liked:episode:${episode.slug}`;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(episode.like_count);
  const [likeBusy, setLikeBusy] = useState(false);

  const [commentStatus, setCommentStatus] = useState<CommentFormStatus>('idle');
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    setLiked(typeof window !== 'undefined' && window.localStorage.getItem(likeKey) === '1');
  }, [likeKey]);

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

  async function submitComment(data: { author_name: string; body: string }) {
    setCommentStatus('submitting');
    setCommentError('');
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
    } catch (err) {
      setCommentStatus('error');
      setCommentError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  function resetComment() {
    setCommentStatus('idle');
    setCommentError('');
  }

  return {
    liked, likeCount, likeBusy, toggleLike,
    commentStatus, commentError, submitComment, resetComment,
  };
}
