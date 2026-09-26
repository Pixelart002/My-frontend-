const API_BASE = (
  process.env.LUVIIO_API_BASE ||
  'https://apparent-jordanna-pixelart002-42e39ac6.koyeb.app/api/v1'
).replace(/\/$/, '');

const SITE_URL = (
  process.env.LUVIIO_SITE_URL ||
  'https://www.luviio.in'
).replace(/\/$/, '');

const DEFAULT_IMAGE = `${SITE_URL}/icon-512.png`;

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function text(value, fallback = '') {
  const result = String(value ?? '').replace(/\s+/g, ' ').trim();
  return result || fallback;
}

function firstImage(product) {
  const candidates = [
    product?.image_url,
    ...(Array.isArray(product?.images) ? product.images : []),
  ];

  for (const item of candidates) {
    const url = typeof item === 'string'
      ? item.trim()
      : text(item?.url || item?.image_url || item?.src);

    if (/^https:\/\//i.test(url)) return url;
  }

  return DEFAULT_IMAGE;
}

function productPayload(payload) {
  if (payload?.data && !Array.isArray(payload.data)) return payload.data;
  if (payload?.product && typeof payload.product === 'object') return payload.product;
  return payload;
}

export default async function handler(req, res) {
  const slug = text(req.query?.slug);

  if (!slug) {
    res.status(400).setHeader('Cache-Control', 'no-store');
    return res.end('Missing product slug.');
  }

  const canonical = `${SITE_URL}/product/${encodeURIComponent(slug)}`;

  try {
    const upstream = await fetch(
      `${API_BASE}/products/${encodeURIComponent(slug)}`,
      {
        headers: {
          accept: 'application/json',
        },
      },
    );

    if (upstream.status === 404) {
      res.status(404).setHeader('X-Robots-Tag', 'noindex');
      return res.end('<!doctype html><html><head><title>Product not found — Luviio</title></head><body><h1>Product not found</h1></body></html>');
    }

    if (!upstream.ok) {
      throw new Error(`Product API returned HTTP ${upstream.status}`);
    }

    const payload = await upstream.json();
    const product = productPayload(payload);

    if (!product || typeof product !== 'object') {
      throw new Error('Product API returned an invalid payload');
    }

    const name = text(product.name, 'Luviio Product');
    const description = text(
      product.seo_description || product.short_description || product.description,
      `Shop ${name} on Luviio.`,
    ).slice(0, 300);
    const seoTitle = text(product.seo_title, `${name} | Luviio`);
    const seoCanonical = text(product.canonical_url);
    const canonicalUrl = /^https:\/\//i.test(seoCanonical)
      ? seoCanonical
      : canonical;
    const indexable = product.robots_index !== false && product.is_active !== false;
    const followable = product.robots_follow !== false;
    const image = firstImage(product);
    const price = Number(product.price);
    const currency = text(
      product.currency || product.price_currency,
      'INR',
    ).toUpperCase();
    const stock = Number(product.stock);
    const inStock = Number.isFinite(stock)
      ? stock > 0
      : product.is_active !== false;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description,
      url: canonicalUrl,
      image: [image],
      ...(product.sku ? { sku: text(product.sku) } : {}),
      ...(product.brand ? {
        brand: {
          '@type': 'Brand',
          name: text(product.brand),
        },
      } : {}),
      ...(Number.isFinite(price) && price >= 0 ? {
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: currency,
          price,
          availability: inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        },
      } : {}),
    };

    const title = seoTitle;
    const safeSchema = JSON.stringify(schema)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026');

    const priceMarkup = Number.isFinite(price) && price >= 0
      ? `<p class="price">₹${price.toLocaleString('en-IN')}</p>`
      : '';

    const html = `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${indexable ? `index,${followable ? 'follow' : 'nofollow'}` : `noindex,${followable ? 'follow' : 'nofollow'}`},max-image-preview:large">
<link rel="canonical" href="${esc(canonicalUrl)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Luviio">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonicalUrl)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:secure_url" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(name)}">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<script type="application/ld+json">${safeSchema}</script>
<style>
body{margin:0;background:#11100f;color:#f5efe7;font-family:system-ui,sans-serif}
main{max-width:960px;margin:0 auto;padding:32px 20px}
article{display:grid;grid-template-columns:minmax(0,420px) 1fr;gap:32px;align-items:start}
img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:14px;background:#1b1917}
h1{font-size:clamp(28px,5vw,48px);line-height:1.08;margin:0 0 16px}
p{line-height:1.6;color:#a59b91}
.price{font-size:28px;font-weight:700;color:#d8ad6a}
a{color:#d8ad6a}
@media(max-width:700px){article{grid-template-columns:1fr}}
</style>
</head>
<body>
<main>
<article>
<img src="${esc(image)}" alt="${esc(name)}" width="630" height="630">
<section>
<h1>${esc(name)}</h1>
<p>${esc(description)}</p>
${priceMarkup}
<p><a href="${esc(canonicalUrl)}">View product on Luviio</a></p>
</section>
</article>
</main>
</body>
</html>`;

    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=86400',
    );
    res.setHeader('X-Robots-Tag', `${indexable ? 'index' : 'noindex'}, ${followable ? 'follow' : 'nofollow'}`);
    return res.end(html);
  } catch (error) {
    console.error('[Luviio SSR] product render failed', error);
    res.status(502);
    res.setHeader('Cache-Control', 'no-store');
    return res.end('<!doctype html><html><head><title>Luviio — Product temporarily unavailable</title></head><body><h1>Product temporarily unavailable</h1></body></html>');
  }
}
