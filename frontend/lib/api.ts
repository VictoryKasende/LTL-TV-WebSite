const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://backend:8000';

type FetchOpts = { revalidate?: number };

export async function apiGet<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/v1${path}`, {
      next: { revalidate: opts.revalidate ?? 60 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Programme = {
  id: number;
  title: string;
  slug: string;
  description: string;
  host: string;
  schedule: string;
  cover: string | null;
  is_published: boolean;
  created_at: string;
};

export type Temoignage = {
  id: number;
  author: string;
  location: string;
  message: string;
  photo: string | null;
  created_at: string;
};

export type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string | null;
  author_name: string | null;
  category: { id: number; name: string; slug: string } | null;
  published_at: string | null;
  created_at: string;
};
