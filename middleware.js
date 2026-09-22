import { rewrite } from '@vercel/functions';

const BOT_PATTERN = /googlebot|google-inspectiontool|bingbot|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|pinterest|applebot|ahrefsbot|semrushbot|duckduckbot|orcascan|orca[\\s_-]?scan|headlesschrome|phantomjs|puppeteer|playwright|selenium|crawler|spider/i;

export const config = {
  matcher: ['/product/:slug*'],
};

export default function middleware(request) {
  const url = new URL(request.url);
  const slug = url.pathname.slice('/product/'.length).replace(/^\\/+|\\/+$/g, '');

  if (!slug) return;

  const userAgent = request.headers.get('user-agent') || '';
  const fetchMode = request.headers.get('sec-fetch-mode');
  const fetchDest = request.headers.get('sec-fetch-dest');
  const accept = request.headers.get('accept') || '';

  const knownCrawler = BOT_PATTERN.test(userAgent);
  const nonBrowserHtmlFetch =
    !fetchMode &&
    !fetchDest &&
    (accept === '' || accept.includes('text/html') || accept.includes('*/*'));

  if (!knownCrawler && !nonBrowserHtmlFetch) return;

  const target = new URL('/api/product', request.url);
  target.searchParams.set('slug', decodeURIComponent(slug));

  return rewrite(target);
}
