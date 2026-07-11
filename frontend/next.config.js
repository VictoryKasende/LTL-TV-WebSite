/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Without this, Next.js 308-redirects `/api/v1/contacts/` -> `/api/v1/contacts`
  // (stripping the trailing slash) before the rewrite below runs. Django's
  // APPEND_SLASH then refuses to redirect a POST and raises a 500, so every
  // form submission through the API rewrite silently fails.
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
    return [
      // Django/DRF routes require a trailing slash (APPEND_SLASH rejects POST
      // otherwise) — force it here since skipTrailingSlashRedirect above stops
      // Next from normalizing it for us.
      { source: '/api/:path*', destination: `${backend}/api/:path*/` },
      // Mirrors nginx's dedicated /media/ location in production — lets the
      // browser resolve the relative media URLs returned by lib/api.ts.
      { source: '/media/:path*', destination: `${backend}/media/:path*` },
    ];
  },
};

module.exports = nextConfig;
