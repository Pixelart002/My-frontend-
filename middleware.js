/**
 * Vercel Routing Middleware — social preview proxy for product pages.
 *
 * Normal browser → next() → Vercel serves the React SPA.
 * Social crawler → fetch Koyeb /share/products/{slug} → return OG HTML.
 *
 * Search-engine crawlers are intentionally not intercepted.
 */

import { next } from '@vercel/functions';

export const config = {
  matcher: '/product/:slug',
  runtime: 'nodejs',
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

const BACKEND_ORIGIN =
  'https://apparent-jordanna-pixelart002-42e39ac6.koyeb.app';
const SAFE_SLUG_RE = /^[A-Za-z0-9_-]+$/;
const BACKEND_TIMEOUT_MS = 4000;

function isPreviewCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return PREVIEW_CRAWLERS.some((signature) => ua.includes(signature));
}

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const backendResponse = await fetch(
      `${BACKEND_ORIGIN}/share/products/${encodeURIComponent(slug)}`,
      {
        method: 'GET',
        headers: {
          'X-Crawler-Proxy': '1',
          Accept: 'text/html',
        },
        signal: controller.signal,
      },
    );

    if (!backendResponse.ok) {
      return next();
    }

    const html = await backendResponse.text();

    return new Response(html, {
      status: backendResponse.status,
      headers: {
        'Content-Type':
          backendResponse.headers.get('Content-Type') ||
          'text/html; charset=utf-8',
        'Cache-Control':
          backendResponse.headers.get('Cache-Control') ||
          'public, max-age=60, s-maxage=300',
        'X-Robots-Tag':
          backendResponse.headers.get('X-Robots-Tag') || 'index, follow',
      },
    });
  } catch {
    return next();
  } finally {
    clearTimeout(timeout);
  }
}
