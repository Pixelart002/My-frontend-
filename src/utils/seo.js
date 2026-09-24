const SITE = 'https://www.luviio.in';

const DEFAULT_IMAGE = `${SITE}/icon-512.png`;

const DEFAULT_TITLE =
  'Luviio — Beautiful essentials for everyday living';

const DEFAULT_DESCRIPTION =
  'Considered essentials for a more beautiful everyday.';

const JSON_LD_ID = 'luviio-jsonld';

function normalizeText(value, fallback = '') {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const text = String(value)
    .replace(/\s+/g, ' ')
    .trim();

  return text || fallback;
}

function upsertMeta(
  selector,
  attrs,
  content,
) {
  const normalized =
    normalizeText(content);

  const nodes = [
    ...document.head.querySelectorAll(
      selector,
    ),
  ];

  if (!normalized) {
    nodes.forEach((node) =>
      node.remove(),
    );
    return;
  }

  const node =
    nodes[0] ||
    document.createElement('meta');

  nodes
    .slice(1)
    .forEach((duplicate) =>
      duplicate.remove(),
    );

  if (!nodes.length) {
    Object.entries(attrs).forEach(
      ([key, value]) => {
        node.setAttribute(
          key,
          value,
        );
      },
    );

    document.head.appendChild(node);
  }

  node.setAttribute(
    'content',
    normalized,
  );
}

function upsertLink(rel, href) {
  const links = [
    ...document.head.querySelectorAll(
      `link[rel="${rel}"]`,
    ),
  ];

  const node =
    links[0] ||
    document.createElement('link');

  links
    .slice(1)
    .forEach((duplicate) =>
      duplicate.remove(),
    );

  if (!links.length) {
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }

  node.setAttribute(
    'href',
    href,
  );
}

export const absoluteUrl = (
  value,
  fallback = DEFAULT_IMAGE,
) => {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return fallback;
  }

  try {
    const url = new URL(
      value.trim(),
      SITE,
    );

    return url.protocol === 'https:'
      ? url.href
      : fallback;
  } catch {
    return fallback;
  }
};

export const productImage = () =>
  DEFAULT_IMAGE;

export const productDescription = (
  product,
) => {
  const name = normalizeText(
    product?.name,
    'this product',
  );

  const description =
    product?.short_description ??
    product?.description;

  return normalizeText(
    description,
    `Shop ${name} from Luviio.`,
  ).slice(0, 180);
};

function removeJsonLd() {
  document
    .getElementById(JSON_LD_ID)
    ?.remove();
}

function setJsonLd(jsonLd) {
  removeJsonLd();

  if (!jsonLd) {
    return;
  }

  const script =
    document.createElement('script');

  script.id = JSON_LD_ID;
  script.type =
    'application/ld+json';

  script.textContent =
    JSON.stringify(jsonLd);

  document.head.appendChild(script);
}

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
} = {}) {
  if (
    typeof document === 'undefined'
  ) {
    return;
  }

  const normalizedTitle =
    normalizeText(
      title,
      DEFAULT_TITLE,
    );

  const normalizedDescription =
    normalizeText(
      description,
      DEFAULT_DESCRIPTION,
    );

  const url = absoluteUrl(
    path,
    `${SITE}/`,
  );

  const shareImage =
    absoluteUrl(image);

  const normalizedImageAlt =
    normalizeText(
      imageAlt,
      normalizedTitle,
    );

  document.title =
    normalizedTitle;

  upsertMeta(
    'meta[name="description"]',
    { name: 'description' },
    normalizedDescription,
  );

  upsertMeta(
    'meta[name="robots"]',
    { name: 'robots' },
    noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large',
  );

  upsertMeta(
    'meta[property="og:type"]',
    { property: 'og:type' },
    type,
  );

  upsertMeta(
    'meta[property="og:site_name"]',
    { property: 'og:site_name' },
    'Luviio',
  );

  upsertMeta(
    'meta[property="og:locale"]',
    { property: 'og:locale' },
    'en_IN',
  );

  upsertMeta(
    'meta[property="og:title"]',
    { property: 'og:title' },
    normalizedTitle,
  );

  upsertMeta(
    'meta[property="og:description"]',
    { property: 'og:description' },
    normalizedDescription,
  );

  upsertMeta(
    'meta[property="og:url"]',
    { property: 'og:url' },
    url,
  );

  upsertMeta(
    'meta[property="og:image"]',
    { property: 'og:image' },
    shareImage,
  );

  upsertMeta(
    'meta[property="og:image:secure_url"]',
    {
      property:
        'og:image:secure_url',
    },
    shareImage,
  );

  upsertMeta(
    'meta[property="og:image:alt"]',
    {
      property:
        'og:image:alt',
    },
    normalizedImageAlt,
  );

  upsertMeta(
    'meta[property="og:image:width"]',
    {
      property:
        'og:image:width',
    },
    '1200',
  );

  upsertMeta(
    'meta[property="og:image:height"]',
    {
      property:
        'og:image:height',
    },
    '630',
  );

  // Important: remove stale image type when
  // the next page does not provide one.
  upsertMeta(
    'meta[property="og:image:type"]',
    {
      property:
        'og:image:type',
    },
    imageType,
  );

  upsertMeta(
    'meta[name="twitter:card"]',
    { name: 'twitter:card' },
    'summary_large_image',
  );

  upsertMeta(
    'meta[name="twitter:title"]',
    { name: 'twitter:title' },
    normalizedTitle,
  );

  upsertMeta(
    'meta[name="twitter:description"]',
    {
      name: 'twitter:description',
    },
    normalizedDescription,
  );

  upsertMeta(
    'meta[name="twitter:image"]',
    { name: 'twitter:image' },
    shareImage,
  );

  upsertMeta(
    'meta[name="twitter:image:alt"]',
    {
      name: 'twitter:image:alt',
    },
    normalizedImageAlt,
  );

  upsertLink(
    'canonical',
    url,
  );

  setJsonLd(jsonLd);
}

export const setNoindexSeo = (
  path = '/',
) =>
  setPageSeo({
    path,
    noindex: true,
  });

export const siteUrl = SITE;

export const defaultShareImage =
  DEFAULT_IMAGE;

export const defaultSeo = Object.freeze({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
});