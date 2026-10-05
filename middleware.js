/**
 * Vercel Routing Middleware — product SEO + social preview handling.
 *
 * Normal browser → next() → Vercel serves the React SPA.
 * Social/search crawlers → fetch Koyeb /share/products/{slug} → return
 * server-rendered product metadata.
 *
 * Permanently removed legacy product URLs return HTTP 410 instead of falling
 * through to the SPA's 200 response, preventing a soft-404.
 */

import { next } from '@vercel/functions';

export const config = {
  matcher: ['/product/:slug', '/product.html'],
  runtime: 'nodejs',
};

const PREVIEW_CRAWLERS = [
  'googlebot',
  'google-inspectiontool',
  'bingbot',
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
  'orcascan',
  'opengraphxyzbot',
  'opengraph.xyz',
  'opengraph',
  'open graph',
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

function removedLegacyProductResponse(request) {
  const url = new URL(request.url);

  if (
    url.pathname !== '/product.html' ||
    url.searchParams.get('slug') !== 'floor-drainer-square-ring'
  ) {
    return null;
  }

  return new Response('Gone', {
    status: 410,
    headers: {
      'Cache-Control': 'public, max-age=300',
      'X-Robots-Tag': 'noindex, nofollow',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export default async function middleware(request) {
  const removedResponse = removedLegacyProductResponse(request);

  if (removedResponse) {
    return removedResponse;
  }

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
