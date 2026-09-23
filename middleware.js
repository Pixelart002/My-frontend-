/**
 * Vercel Edge Middleware — Social crawler detection for product OG previews.
 *
 * Normal browser → next() → Vercel serves index.html → React SPA
 * Social crawler → fetch Koyeb /share/products/{slug} → return OG HTML
 *
 * Search engine crawlers are intentionally not intercepted.
 */

import { next } from '@vercel/functions';

export const config = {
  matcher: '/product/:slug',
};

const PREVIEW_CRAWLERS = [
  'facebookexternalhit',
  'facebookcatalog',
  'whatsapp',
  'telegrambot',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'pinterest',
  'redditbot',
];

function isPreviewCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return PREVIEW_CRAWLERS.some((sig) => ua.includes(sig));
}

const BACKEND_ORIGIN = 'https://apparent-jordanna-pixelart002-42e39ac6.koyeb.app';
const SAFE_SLUG_RE = /^[\w-]+$/;

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';

  if (!isPreviewCrawler(ua)) {
    return next();
  }

  const { pathname } = new URL(request.url);
  const match = pathname.match(/^\/product\/([^/?#]+)$/);

  if (!match) {
    return next();
  }

  const slug = match[1];

  if (!SAFE_SLUG_RE.test(slug)) {
    return next();
  }

  try {
    const backendResponse = await fetch(
      `${BACKEND_ORIGIN}/share/products/${slug}`,
      {
        method: 'GET',
        headers: {
          'X-Crawler-Proxy': '1',
        },
      },
    );

    if (!backendResponse.ok) {
      return next();
    }

    const html = await backendResponse.text();

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control':
          backendResponse.headers.get('Cache-Control') ||
          'public, max-age=60, s-maxage=300',
        'X-Robots-Tag': 'index, follow',
      },
    });
  } catch {
    return next();
  }
}
