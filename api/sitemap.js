const API_BASE = (
  process.env.LUVIIO_API_BASE ||
  'https://apparent-jordanna-pixelart002-42e39ac6.koyeb.app/api/v1'
).replace(/\/$/, '');

const SITE_URL = (
  process.env.LUVIIO_SITE_URL ||
  'https://www.luviio.in'
).replace(/\/$/, '');

const esc = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

async function fetchProducts() {
  const products = [];
  let page = 1;
  const pageSize = 100;
  const maxPages = 100;

  while (page <= maxPages) {
    const response = await fetch(
      `${API_BASE}/products?page=${page}&page_size=${pageSize}`,
      { headers: { accept: 'application/json' } },
    );

    if (!response.ok) {
      throw new Error(`Product API returned HTTP ${response.status}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.data) ? payload.data : [];
    products.push(...items);

    const totalPages = Number(payload?.meta?.total_pages);
    if (items.length === 0 || (Number.isFinite(totalPages) && page >= totalPages) || items.length < pageSize) {
      break;
    }
    page += 1;
  }

  return products;
}

export default async function handler(req, res) {
  try {
    const products = await fetchProducts();
    const urls = products
      .filter((product) => product?.slug && product?.is_active !== false)
      .map((product) => {
        const slug = String(product.slug).trim();
        const lastmodValue = product.updated_at || product.updatedAt || product.created_at;
        const lastmod = lastmodValue ? new Date(lastmodValue) : null;
        const lastmodTag = lastmod && !Number.isNaN(lastmod.getTime())
          ? `    <lastmod>${lastmod.toISOString()}</lastmod>\n`
          : '';
        return `  <url>\n    <loc>${SITE_URL}/product/${encodeURIComponent(slug)}</loc>\n${lastmodTag}    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE_URL}/</loc>\n  </url>\n  <url>\n    <loc>${SITE_URL}/shop</loc>\n  </url>${urls ? `\n${urls}` : ''}\n</urlset>\n`;

    res.status(200);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=86400');
    return res.end(xml);
  } catch (error) {
    console.error('[Luviio Sitemap] generation failed', error);
    res.status(503);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}
