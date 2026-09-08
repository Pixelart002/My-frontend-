const BACKEND = (process.env.LUVIIO_API_BASE || 'https://apparent-jordanna-pixelart002-42e39ac6.koyeb.app/api/v1').replace(/\/$/, '');
const SITE = 'https://www.luviio.in';

const escapeXml = (value = '') => String(value).replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]));

export default async function handler(req, res) {
  const slug = String(req.query?.slug || '').trim();
  if (!slug) return res.status(400).setHeader('Content-Type', 'text/plain').send('Missing slug');

  let product = null;
  try {
    const response = await fetch(`${BACKEND}/products/${encodeURIComponent(slug)}`, { headers: { accept: 'application/json' } });
    if (response.ok) {
      const payload = await response.json();
      product = payload?.data || payload;
    }
  } catch {}

  const name = product?.name || 'Luviio product';
  const category = product?.categories?.name || product?.category_name || 'Luviio collection';
  const price = Number(product?.price);
  const image = product?.image_url || `${SITE}/og-default.svg`;
  const title = `${name} — Luviio`;
  const subtitle = Number.isFinite(price) && price > 0 ? `Shop ${category} · ₹${price.toLocaleString('en-IN')}` : `Shop ${category}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#101010"/><rect x="34" y="34" width="1132" height="562" rx="28" fill="#171717" stroke="#3b3328"/><text x="72" y="112" fill="#d8ad6a" font-family="Georgia,serif" font-size="25" letter-spacing="7">LUVIIO</text><rect x="72" y="145" width="420" height="410" rx="18" fill="#211f1c"/>${image ? `<image href="${escapeXml(image)}" x="72" y="145" width="420" height="410" preserveAspectRatio="xMidYMid slice"/>` : ''}<text x="535" y="225" fill="#aaa39a" font-family="Arial,sans-serif" font-size="22" letter-spacing="2">${escapeXml(category.toUpperCase())}</text><text x="535" y="295" fill="#f3eee7" font-family="Georgia,serif" font-size="48">${escapeXml(name.slice(0, 34))}</text><text x="535" y="350" fill="#aaa39a" font-family="Arial,sans-serif" font-size="25">${escapeXml(subtitle)}</text><text x="535" y="515" fill="#d8ad6a" font-family="Arial,sans-serif" font-size="21">www.luviio.in</text></svg>`;

  res.status(200).setHeader('Content-Type', 'image/svg+xml; charset=utf-8').setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600').send(svg);
}
