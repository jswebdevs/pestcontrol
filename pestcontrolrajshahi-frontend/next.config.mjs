/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  turbopack: {
    // Allows Turbopack to securely access hoisted packages 3 levels up
    root: path.resolve(__dirname, '../../../'),
  },
  // Legacy CTA target. Booking is handled by an on-page modal, so any stray
  // `/order` link (old CMS data, bookmarks) resolves to /contact instead of 404.
  async redirects() {
    return [{ source: '/order', destination: '/contact', permanent: false }];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;