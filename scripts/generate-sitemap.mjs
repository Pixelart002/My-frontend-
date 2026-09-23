import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SITE_URL = 'https://www.luviio.in';
const API_BASE = (process.env.SITEMAP_API_BASE || 'https://apparent-jordanna-pixelart002-42e39ac6.koyeb.app/api/v1').replace(/\/$/, '');
const SITEMAP_PATH = resolve('public/sitemap.xml');

const xmlEscape = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const normalizeDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

const fetchProducts = async () => {
  const products = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const response = await fetch(
      `${API_BASE}/products?page=${page}&page_size=${pageSize}`,
      { headers: { accept: 'application/json' } },
    );

    if (!response.ok) {
      throw new Error(`Product sitemap API returned HTTP ${response.status}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.data) ? payload.data : [];
    const totalPages = Number(payload?.meta?.total_pages) || (items.length < pageSize ? page : page + 1);

    products.push(...items);
    if (page >= totalPages || items.length === 0) break;
    page += 1;
  }

  return products;
};

const renderProductUrls = (products) => products
  .map((product) => {
    const slug = String(product?.slug || '').trim();
    if (!slug || product?.is_active === false) return '';
    const lastmod = normalizeDate(product?.updated_at || product?.updatedAt || product?.created_at);
    return [
      '  <url>',
      `    <loc>${SITE_URL}/product/${encodeURIComponent(slug)}</loc>`,
      `    <lastmod>${xmlEscape(lastmod)}</lastmod>`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.8</priority>',
      '  </url>',
    ].join('\n');
  })
  .filter(Boolean)
  .join('\n');

const main = async () => {
  const current = await readFile(SITEMAP_PATH, 'utf8');
  const productUrls = renderProductUrls(await fetchProducts());
  const marker = '  <!-- LUVIIO_DYNAMIC_PRODUCT_URLS -->';
  const block = productUrls ? `${marker}\n${productUrls}` : marker;

  let sitemap = current;
  const markerPattern = /  <!-- LUVIIO_DYNAMIC_PRODUCT_URLS -->[\s\S]*?(?=\n<\/urlset>)/;
  if (markerPattern.test(sitemap)) {
    sitemap = sitemap.replace(markerPattern, block);
  } else {
    sitemap = sitemap.replace('\n</urlset>', `\n${block}\n</urlset>`);
  }

  await writeFile(SITEMAP_PATH, sitemap, 'utf8');
  console.log(`Generated sitemap with ${productUrls ? productUrls.split('<url>').length - 1 : 0} dynamic product URLs.`);
};

main().catch((error) => {
  console.warn(`Sitemap product generation skipped: ${error.message}`);
  console.warn('Keeping the committed static sitemap so the build remains fail-open.');
});
