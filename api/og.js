import { ImageResponse } from '@vercel/og';

const BACKEND = (process.env.LUVIIO_API_BASE || 'https://apparent-jordanna-pixelart002-42e39ac6.koyeb.app/api/v1').replace(/\/$/, '');
const SITE = 'https://www.luviio.in';

export const config = { runtime: 'edge' };

const clean = (value = '') => String(value).replace(/\s+/g, ' ').trim();

export default async function handler(req) {
  const url = new URL(req.url);
  const slug = String(url.searchParams.get('slug') || '').trim();

  if (!slug) return new Response('Missing slug', { status: 400 });

  let product = null;
  try {
    const response = await fetch(`${BACKEND}/products/${encodeURIComponent(slug)}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (response.ok) {
      const payload = await response.json();
      product = payload?.data || payload;
    }
  } catch {}

  if (!product) return new Response('Product not found', { status: 404 });

  const name = clean(product.name || 'Luviio product');
  const category = clean(product.categories?.name || product.category_name || 'Luviio collection');
  const price = Number(product.price);
  const image = String(product.image_url || product.images?.[0] || '').trim() || `${SITE}/og-default.svg`;
  const subtitle = Number.isFinite(price) && price > 0
    ? `Shop ${category} · ₹${price.toLocaleString('en-IN')}`
    : `Shop ${category}`;

  const response = new ImageResponse({
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        background: '#101010',
        color: '#f3eee7',
        padding: '34px',
        fontFamily: 'Arial',
      },
      children: [{
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            width: '1132px',
            height: '562px',
            borderRadius: '28px',
            background: '#171717',
            border: '1px solid #3b3328',
            overflow: 'hidden',
            padding: '38px',
            boxSizing: 'border-box',
          },
          children: [
            {
              type: 'div',
              props: {
                style: { display: 'flex', color: '#d8ad6a', fontSize: '25px', letterSpacing: '7px', marginBottom: '28px' },
                children: 'LUVIIO',
              },
            },
            {
              type: 'div',
              props: {
                style: { display: 'flex', flexDirection: 'row', flex: 1, gap: '42px' },
                children: [
                  {
                    type: 'img',
                    props: {
                      src: image,
                      width: 420,
                      height: 410,
                      style: { width: '420px', height: '410px', objectFit: 'cover', borderRadius: '18px' },
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', flexDirection: 'column', flex: 1, paddingTop: '28px' },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', color: '#aaa39a', fontSize: '22px', letterSpacing: '2px', marginBottom: '24px' },
                            children: category.toUpperCase(),
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', color: '#f3eee7', fontSize: '46px', lineHeight: 1.08, fontWeight: 600, marginBottom: '22px' },
                            children: name.slice(0, 58),
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', color: '#aaa39a', fontSize: '25px', lineHeight: 1.3 },
                            children: subtitle,
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', color: '#d8ad6a', fontSize: '21px', marginTop: 'auto' },
                            children: 'www.luviio.in',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      }],
    },
  }, { width: 1200, height: 630 });

  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  return response;
}
