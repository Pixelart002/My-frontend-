const SITE = 'https://www.luviio.in';
const DEFAULT_IMAGE = `${SITE}/og-default.svg`;

const upsertMeta = (selector, attrs, content) => {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    document.head.appendChild(node);
  }
  node.setAttribute('content', content || '');
};

const upsertLink = (rel, href) => {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }
  node.setAttribute('href', href);
};

export function setPageSeo({
  title = 'Luviio — Beautiful essentials for everyday living',
  description = 'Considered essentials for a more beautiful everyday.',
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  jsonLd,
}) {
  if (typeof document === 'undefined') return;

  const url = new URL(path || '/', SITE).href;
  const safeImage = image || DEFAULT_IMAGE;
  document.title = title;
  upsertMeta('meta[name="description"]', { name: 'description' }, description);
  upsertMeta('meta[name="robots"]', { name: 'robots' }, noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  upsertMeta('meta[property="og:type"]', { property: 'og:type' }, type);
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, 'Luviio');
  upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title);
  upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description);
  upsertMeta('meta[property="og:url"]', { property: 'og:url' }, url);
  upsertMeta('meta[property="og:image"]', { property: 'og:image' }, safeImage);
  upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width' }, '1200');
  upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height' }, '630');
  upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, title);
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, safeImage);
  upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, title);
  upsertLink('canonical', url);

  const existing = document.getElementById('luviio-jsonld');
  if (existing) existing.remove();
  if (jsonLd) {
    const script = document.createElement('script');
    script.id = 'luviio-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}

export const siteUrl = SITE;
export const defaultShareImage = DEFAULT_IMAGE;
