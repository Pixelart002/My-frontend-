const SITE = 'https://www.luviio.in';
const DEFAULT_IMAGE = `${SITE}/icon-512.png`;
const DEFAULT_TITLE = 'Luviio — Beautiful essentials for everyday living';
const DEFAULT_DESCRIPTION = 'Considered essentials for a more beautiful everyday.';

const upsertMeta = (selector, attrs, content) => {
  if (!content) {
    document.head.querySelectorAll(selector).forEach((node) => node.remove());
    return;
  }
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
};

const upsertLink = (rel, href) => {
  const links = [...document.head.querySelectorAll(`link[rel="${rel}"]`)];
  const node = links[0] || document.createElement('link');
  links.slice(1).forEach((duplicate) => duplicate.remove());
  if (!links.length) {
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }
  node.setAttribute('href', href);
};

const absoluteUrl = (value, fallback = DEFAULT_IMAGE) => {
  if (!value || typeof value !== 'string') return fallback;
  try {
    const url = new URL(value, SITE);
    return url.protocol === 'https:' ? url.href : fallback;
  } catch {
    return fallback;
  }
};

const cleanText = (value, fallback = '') => String(value || fallback).replace(/\s+/g, ' ').trim();

export const productImage = (product) => {
  const candidates = [product?.image_url, ...(Array.isArray(product?.images) ? product.images : [])];
  return candidates.map((value) => absoluteUrl(value, '')).find(Boolean) || DEFAULT_IMAGE;
};

export const productDescription = (product) => cleanText(
  product?.short_description || product?.description,
  `Shop ${cleanText(product?.name, 'this product')} from Luviio.`,
).slice(0, 180);

export function setPageSeo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  jsonLd,
  imageAlt = title,
  imageType,
}) {
  if (typeof document === 'undefined') return;

  const url = absoluteUrl(path, `${SITE}/`);
  const shareImage = absoluteUrl(image);
  document.title = title;
  upsertMeta('meta[name="description"]', { name: 'description' }, description);
  upsertMeta('meta[name="robots"]', { name: 'robots' }, noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  upsertMeta('meta[property="og:type"]', { property: 'og:type' }, type);
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, 'Luviio');
  upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, 'en_IN');
  upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title);
  upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description);
  upsertMeta('meta[property="og:url"]', { property: 'og:url' }, url);
  upsertMeta('meta[property="og:image"]', { property: 'og:image' }, shareImage);
  upsertMeta('meta[property="og:image:secure_url"]', { property: 'og:image:secure_url' }, shareImage);
  upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, imageAlt);
  upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width' }, '1200');
  upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height' }, '630');
  if (imageType) upsertMeta('meta[property="og:image:type"]', { property: 'og:image:type' }, imageType);
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, shareImage);
  upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, imageAlt);
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

export const setNoindexSeo = (path = '/') => setPageSeo({ path, noindex: true });
export const siteUrl = SITE;
export const defaultShareImage = DEFAULT_IMAGE;
export const defaultSeo = { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
export { absoluteUrl };
