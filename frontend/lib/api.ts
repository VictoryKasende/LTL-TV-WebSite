const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://backend:8000';

// Django builds absolute media URLs (cover/photo/logo/…) from the Host it was
// called with — which, for server-side fetches, is the internal Docker
// hostname above. That host isn't reachable from the visitor's browser, so we
// rewrite it back to a same-origin relative path; the frontend proxies
// `/media/*` to the backend (see next.config.js), exactly like nginx does in
// production. Absolute URLs on any other host (e.g. Cloudinary in prod) are
// left untouched.
const INTERNAL_ORIGIN_RE = new RegExp(`^${INTERNAL_API_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);

export function fixMediaUrls<T>(data: T): T {
  if (typeof data === 'string') {
    return data.replace(INTERNAL_ORIGIN_RE, '') as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => fixMediaUrls(item)) as unknown as T;
  }
  if (data && typeof data === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      out[key] = fixMediaUrls(value);
    }
    return out as T;
  }
  return data;
}

type FetchOpts = { revalidate?: number };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries only transient failures (network errors, 5xx) — never a clean 404/400,
// which is a legitimate "not found" and should return null immediately.
//
// Without this, a backend blip during ISR regeneration (e.g. a container
// restart) gets cached by Next as if it were a real empty result, and stays
// that way for the full `revalidate` window until the next visitor happens
// to trigger a regeneration that succeeds.
const RETRY_DELAYS_MS = [150, 400];

export async function apiGet<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${INTERNAL_API_URL}/api/v1${path}`, {
        next: { revalidate: opts.revalidate ?? 60 },
        headers: { Accept: 'application/json' },
      });
      if (res.ok) return fixMediaUrls((await res.json()) as T);
      if (res.status < 500 || attempt >= RETRY_DELAYS_MS.length) return null;
    } catch {
      if (attempt >= RETRY_DELAYS_MS.length) return null;
    }
    await sleep(RETRY_DELAYS_MS[attempt]);
  }
}

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// ---------------------------------------------------------------------------
// Émissions (shows, series, episodes)
// ---------------------------------------------------------------------------
export type EmissionCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  order: number;
};

export type Show = {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  host: string;
  host_photo: string | null;
  cover: string | null;
  logo: string | null;
  color: string;
  default_schedule: string;
  youtube_channel_url: string;
  order: number;
  status: string;
  published_at: string | null;
  is_featured: boolean;
  tags: string[];
  episodes_count: number;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string | null;
  canonical_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type Episode = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  show: number;
  show_slug: string;
  show_title: string;
  series: number | null;
  series_slug: string | null;
  series_title: string | null;
  episode_number: number | null;
  speaker: string;
  guests: { name: string; role: string }[];
  youtube_url: string;
  youtube_id: string;
  embed_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  cover: string | null;
  aired_at: string | null;
  categories: EmissionCategory[];
  tags: string[];
  status: string;
  published_at: string | null;
  is_featured: boolean;
  is_locked: boolean;
  view_count: number;
  description?: string;
};

export type Series = {
  id: number;
  slug: string;
  show: number;
  show_slug: string;
  show_title: string;
  title: string;
  theme: string;
  description: string;
  cover: string | null;
  starts_on: string | null;
  ends_on: string | null;
  order: number;
  status: string;
  published_at: string | null;
  is_featured: boolean;
  episode_count: number;
  created_at: string;
  updated_at: string;
  episodes?: Episode[];
};

// ---------------------------------------------------------------------------
// Programmes hebdomadaires
// ---------------------------------------------------------------------------
export type ProgramType = {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  order: number;
};

export type Programme = {
  id: number;
  slug: string;
  date: string;
  start_time: string;
  end_time: string | null;
  title: string;
  responsable: string;
  program_type: ProgramType | null;
  mode: 'in_person' | 'online' | 'hybrid';
  location: string;
  meeting_url: string;
  image: string | null;
  youtube_url: string;
  youtube_id: string;
  thumbnail_url: string;
  embed_url: string;
  order: number;
  status: string;
  published_at: string | null;
  is_featured: boolean;
  is_upcoming: boolean;
  is_online_accessible: boolean;
  description?: string;
  address?: string;
};

// ---------------------------------------------------------------------------
// Témoignages
// ---------------------------------------------------------------------------
export type Temoignage = {
  id: number;
  slug: string;
  author_name: string;
  country: string;
  city: string;
  title: string;
  story_short: string;
  story: string;
  photo: string | null;
  is_featured: boolean;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------
export type ArticleCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  cover: string | null;
  color: string;
  icon: string;
  order: number;
  articles_count?: number;
};

export type ArticleAuthor = {
  id: number;
  username: string;
  display_name: string;
  avatar: string | null;
  bio: string;
};

export type Article = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  cover: string | null;
  cover_alt: string;
  category: ArticleCategory | null;
  author: ArticleAuthor | null;
  tags: string[];
  reading_time_minutes: number;
  view_count: number;
  status: string;
  published_at: string | null;
  is_featured: boolean;
  created_at: string;
  content_html?: string;
  cover_credit?: string;
};

// ---------------------------------------------------------------------------
// Bannières carousel
// ---------------------------------------------------------------------------
export type BannerImageVariant = {
  id: number;
  variant: 'mobile' | 'tablet' | 'desktop' | 'ultrawide';
  image: string;
  width: number | null;
  height: number | null;
  min_viewport_width: number | null;
};

export type Banner = {
  id: number;
  title: string;
  public_title: string;
  link_url: string;
  link_target: '_self' | '_blank';
  alt_text: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  order: number;
  images: BannerImageVariant[];
  is_active_now: boolean;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// À propos
// ---------------------------------------------------------------------------
export type AboutPage = {
  mission: string;
  vision: string;
  history_text: string;
  founded_year: number | null;
  cover: string | null;
  meta_title: string;
  meta_description: string;
  og_image: string | null;
  canonical_url: string;
  updated_at: string;
};

export type CoreValue = {
  id: number;
  title: string;
  description: string;
  icon: string;
  order: number;
};

export type TeamMember = {
  id: number;
  full_name: string;
  role: string;
  category: string;
  category_display: string;
  bio: string;
  photo: string | null;
  email: string;
  phone: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  linkedin_url: string;
  youtube_url: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------
export const getShows = (opts?: FetchOpts) =>
  apiGet<Paginated<Show>>('/emissions/shows/', opts);

export const getShow = (slug: string, opts?: FetchOpts) =>
  apiGet<Show>(`/emissions/shows/${slug}/`, opts);

export const getShowSeries = (slug: string, opts?: FetchOpts) =>
  apiGet<Series[]>(`/emissions/shows/${slug}/series/`, opts);

export const getEpisodes = (query = '', opts?: FetchOpts) =>
  apiGet<Paginated<Episode>>(`/emissions/episodes/${query}`, opts);

export const getActiveBanners = (opts?: FetchOpts) =>
  apiGet<Banner[]>('/banners/active/', opts);

export const getAboutPage = (opts?: FetchOpts) =>
  apiGet<AboutPage>('/about/page/', opts);

export const getTeam = (query = '', opts?: FetchOpts) =>
  apiGet<Paginated<TeamMember>>(`/about/team/${query}`, opts);

export const getValues = (opts?: FetchOpts) =>
  apiGet<CoreValue[]>('/about/values/', opts);

export const getTestimonials = (query = '', opts?: FetchOpts) =>
  apiGet<Paginated<Temoignage>>(`/temoignages/${query}`, opts);

export const getProgrammes = (query = '', opts?: FetchOpts) =>
  apiGet<Paginated<Programme>>(`/programmes/${query}`, opts);

export const getArticles = (query = '', opts?: FetchOpts) =>
  apiGet<Paginated<Article>>(`/articles/${query}`, opts);
