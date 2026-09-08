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
  return node;
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
  document.title = title;
  upsertMeta('meta[name="description"]', { name: 'description' }, description);
  upsertMeta('meta[name="robots"]', { name: 'robots' }, noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  upsertMeta('meta[property="og:type"]', { property: 'og:type' }, type);
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, 'Luviio');
  upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title);
  upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description);
  upsertMeta('meta[property="og:url"]', { property: 'og:url' }, url);
  upsertMeta('meta[property="og:image"]', { property: 'og:image' }, image || DEFAULT_IMAGE);
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, image || DEFAULT_IMAGE);
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
