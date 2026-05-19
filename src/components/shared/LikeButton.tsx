'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface LikeButtonProps {
  postId: string;
}

export default function LikeButton({ postId }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Fetch initial state
  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/post-reactions?post_id=${postId}`, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        setLiked(data.liked);
        setCount(data.count);
      })
      .catch(() => {});
  }, [postId]);

  const handleToggle = async () => {
    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((c) => (wasLiked ? c - 1 : c + 1));
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/post-reactions?post_id=${postId}`,
        {
          method: 'POST',
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          },
        },
      );
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      // Revert on error
      setLiked(wasLiked);
      setCount((c) => (wasLiked ? c + 1 : c - 1));
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`group inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-300 ${
        liked
          ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-500'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-red-200 dark:hover:border-red-800 hover:text-red-400'
      }`}
      aria-label={liked ? 'Unlike this article' : 'Like this article'}
    >
      <Heart
        className={`w-5 h-5 transition-transform duration-300 ${
          liked ? 'fill-red-500 text-red-500' : 'group-hover:scale-110'
        } ${isAnimating ? 'scale-125' : ''}`}
      />
      <span className="text-sm font-medium tabular-nums">{count}</span>
    </button>
  );
}
