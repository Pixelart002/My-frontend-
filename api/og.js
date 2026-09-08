const BACKEND = (process.env.LUVIIO_API_BASE || 'https://apparent-jordanna-pixelart002-42e39ac6.koyeb.app/api/v1').replace(/\/$/, '');
const SITE = 'https://www.luviio.in';

const firstImage = (product) => {
  const candidates = [
    product?.image_url,
    product?.image,
    product?.imageUrl,
    Array.isArray(product?.images) ? product.images[0] : null,
  ];
  const value = candidates.find((item) => typeof item === 'string' && item.trim());
  return value ? value.trim() : '';
};

export default async function handler(req, res) {
  const slug = String(req.query?.slug || '').trim();
  if (!slug) return res.status(400).setHeader('Content-Type', 'text/plain').send('Missing slug');

  try {
    const response = await fetch(`${BACKEND}/products/${encodeURIComponent(slug)}`, { headers: { accept: 'application/json' } });
    if (response.ok) {
      const payload = await response.json();
      const product = payload?.data || payload?.product || payload;
      const imageUrl = firstImage(product);

      if (imageUrl) {
        const imageResponse = await fetch(imageUrl, { redirect: 'follow' });
        if (imageResponse.ok) {
          const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
          if (contentType.startsWith('image/')) {
            const body = Buffer.from(await imageResponse.arrayBuffer());
            res.status(200).setHeader('Content-Type', contentType).setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600').send(body);
            return;
          }
        }
      }
    }
  } catch {}

  const fallback = await fetch(`${SITE}/og-default.svg`);
  const body = Buffer.from(await fallback.arrayBuffer());
  res.status(200).setHeader('Content-Type', 'image/svg+xml').setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600').send(body);
}
