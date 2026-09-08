const BACKEND = (process.env.LUVIIO_API_BASE || 'https://apparent-jordanna-pixelart002-42e39ac6.koyeb.app/api/v1').replace(/\/$/, '');
const SITE = 'https://www.luviio.in';

const xml = (value = '') => String(value).replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]));

export default async function handler(_req, res) {
  const urls = [
    ['/', 'daily', '1.0'], ['/shop', 'daily', '0.9'], ['/about', 'monthly', '0.5'],
    ['/privacy', 'yearly', '0.3'], ['/terms', 'yearly', '0.3'], ['/shipping', 'yearly', '0.3'],
    ['/refund', 'yearly', '0.3'], ['/returns', 'yearly', '0.3'],
  ];

  try {
    for (let page = 1; page <= 20; page += 1) {
      const response = await fetch(`${BACKEND}/products?page=${page}&page_size=100`, { headers: { accept: 'application/json' } });
      if (!response.ok) break;
      const payload = await response.json();
      const items = Array.isArray(payload) ? payload : payload?.items || payload?.data || [];
      if (!Array.isArray(items) || items.length === 0) break;
      for (const product of items) {
        const slug = product?.slug;
        if (slug) urls.push([`/product/${encodeURIComponent(slug)}`, 'weekly', '0.8']);
      }
      if (items.length < 100) break;
    }
  } catch {}

  const body = urls.map(([path, frequency, priority]) => `  <url><loc>${xml(`${SITE}${path}`)}</loc><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`).join('');
  res.status(200).setHeader('Content-Type', 'application/xml; charset=utf-8').setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
}
