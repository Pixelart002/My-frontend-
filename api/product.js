const BACKEND = (process.env.LUVIIO_API_BASE || 'https://apparent-jordanna-pixelart002-42e39ac6.koyeb.app/api/v1').replace(/\/$/, '');
const SITE = 'https://www.luviio.in';
const escapeHtml = (value = '') => String(value).replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
const escapeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const firstImage = (product) => {
  const candidates = [
    product?.image_url,
    product?.image,
    product?.imageUrl,
    Array.isArray(product?.images) ? product.images[0] : null,
  ];
  const value = candidates.find((item) => typeof item === 'string' && item.trim());
  return value ? value.trim() : `${SITE}/og-default.svg`;
};

export default async function handler(req, res) {
  const slug = String(req.query?.slug || '').trim();
  if (!slug) return res.status(404).send('Not found');

  let product = null;
  try {
    const response = await fetch(`${BACKEND}/products/${encodeURIComponent(slug)}`, { headers: { accept: 'application/json' } });
    if (response.ok) {
      const payload = await response.json();
      product = payload?.data || payload?.product || payload;
    }
  } catch {}

  if (!product) return res.status(404).setHeader('Cache-Control', 'public, max-age=60').send('Product not found');

  const name = String(product.name || 'Luviio product');
  const description = String(product.short_description || product.description || `Shop ${name} from Luviio.`).replace(/\s+/g, ' ').slice(0, 180);
  const url = `${SITE}/product/${encodeURIComponent(slug)}`;
  const image = firstImage(product);
  const price = Number(product.price);
  const availability = product.is_active === false || (Number.isFinite(Number(product.stock)) && Number(product.stock) <= 0) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';
  const category = product.categories?.name || product.category_name || 'Luviio collection';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: [image],
    category,
    url,
    brand: { '@type': 'Brand', name: 'Luviio' },
    ...(Number.isFinite(price) && price > 0 ? { offers: { '@type': 'Offer', url, priceCurrency: 'INR', price, availability, seller: { '@type': 'Organization', name: 'Luviio', url: SITE } } } : {}),
  };

  const ogImage = `${SITE}/api/og?slug=${encodeURIComponent(slug)}`;
  const html = `<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow,max-image-preview:large"><title>${escapeHtml(name)} — Luviio</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${url}"><meta property="og:type" content="product"><meta property="og:site_name" content="Luviio"><meta property="og:title" content="${escapeHtml(name)} — Luviio"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${ogImage}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${escapeHtml(name)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(name)} — Luviio"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${ogImage}"><meta name="twitter:image:alt" content="${escapeHtml(name)}"><script type="application/ld+json">${escapeJson(schema)}</script><style>body{margin:0;background:#101010;color:#f3eee7;font:16px system-ui,sans-serif}main{max-width:900px;margin:0 auto;padding:48px 24px}h1{font:48px Georgia,serif;margin:12px 0}p{color:#aaa39a;line-height:1.6}a{color:#d8ad6a}</style></head><body><main><small>LUVIIO</small><h1>${escapeHtml(name)}</h1><p>${escapeHtml(description)}</p><a href="${url}">Open product</a></main><script>window.location.replace(${JSON.stringify(url)});</script></body></html>`;
  res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600').send(html);
}
