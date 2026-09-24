import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiArrowRightLine,
  RiGridLine,
  RiToolsLine,
  RiWaterFlashLine,
  RiDropLine,
  RiHomeGearLine,
  RiShieldCheckLine,
  RiTruckLine,
  RiPriceTag3Line,
} from '@remixicon/react';
import { productService } from '../services/products';
import ProductCard from '../components/ProductCard';
import { ProductSkeletons, ErrorState } from '../components/ui/States';

const CATEGORY_ICONS = {
  'bathroom fittings': RiHomeGearLine,
  'drainage systems': RiGridLine,
  sanitary: RiDropLine,
  'pipes & fittings': RiWaterFlashLine,
  'bathroom accessories': RiHomeGearLine,
  hardware: RiToolsLine,
};

function categoryIcon(name) {
  return CATEGORY_ICONS[String(name || '').trim().toLowerCase()] || RiGridLine;
}

const UI = {
  page: '#080808',
  surface: '#10100f',
  surfaceSoft: 'rgba(255,255,255,.035)',
  border: 'rgba(255,255,255,.09)',
  borderGold: 'rgba(216,173,106,.25)',
  text: '#f5efe8',
  muted: '#b7b0a8',
  gold: '#d8ad6a',
  goldStrong: '#b89143',
};

const styles = {
  page: {
    minHeight: '100%',
    overflow: 'hidden',
    background: UI.page,
    color: UI.text,
  },
  width: {
    width: 'min(1240px, calc(100% - 32px))',
    margin: '0 auto',
  },
  section: {
    padding: 'clamp(42px, 6vw, 78px) 0',
  },
  eyebrow: {
    margin: 0,
    color: UI.gold,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '.16em',
    lineHeight: 1.4,
    textTransform: 'uppercase',
  },
  heading: {
    margin: '8px 0 0',
    color: UI.text,
    fontSize: 'clamp(1.65rem, 3.2vw, 2.8rem)',
    lineHeight: 1.08,
    letterSpacing: '-.035em',
  },
  body: {
    margin: 0,
    color: UI.muted,
    fontSize: 'clamp(.9rem, 1.4vw, 1rem)',
    lineHeight: 1.75,
  },
  arrowLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    color: UI.text,
    fontSize: 13,
    fontWeight: 750,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  card: {
    border: `1px solid ${UI.border}`,
    borderRadius: 22,
    background: 'linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.018))',
    boxShadow: '0 18px 55px rgba(0,0,0,.18)',
  },
};

export default function HomePage() {
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState('');

  const loadStore = useCallback(async () => {
    setError('');
    try {
      const [data, categoryData] = await Promise.all([
        productService.list({ page: 1, page_size: 8 }),
        productService.categories(),
      ]);

      const productItems = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data?.items)
            ? data.data.items
            : [];

      const categoryItems = Array.isArray(categoryData)
        ? categoryData.filter(Boolean)
        : [];

      setProducts(productItems.filter(Boolean));
      setCategories(categoryItems);
    } catch (err) {
      setError(err?.message || 'Unable to load the store.');
    }
  }, []);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  useEffect(() => {
    const root = document.querySelector('.home-landing');
    if (!root) return undefined;

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) return undefined;

    let cancelled = false;
    let ctx;

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([gsapModule, triggerModule]) => {
        if (cancelled) return;

        const gsap = gsapModule.default;
        const ScrollTrigger =
          triggerModule.ScrollTrigger || triggerModule.default;

        if (!gsap || !ScrollTrigger) return;

        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {
          gsap.fromTo(
            '[data-rise]',
            { y: 22, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              stagger: 0.08,
              ease: 'power3.out',
            },
          );

          gsap.utils.toArray('[data-reveal]').forEach((el) => {
            gsap.fromTo(
              el,
              { y: 24, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: el,
                  start: 'top 88%',
                },
              },
            );
          });
        }, root);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <main className="home-landing" style={styles.page}>
      <section
        style={{
          position: 'relative',
          isolation: 'isolate',
          minHeight: 'min(760px, 82vh)',
          display: 'grid',
          alignItems: 'end',
          padding: 'clamp(70px, 10vw, 128px) 0 clamp(44px, 6vw, 76px)',
          background:
            'linear-gradient(90deg, rgba(8,8,8,.96) 0%, rgba(8,8,8,.82) 48%, rgba(8,8,8,.48) 100%), url("/luviio-hero-background.webp") center/cover no-repeat',
          borderBottom: `1px solid ${UI.border}`,
        }}
        aria-labelledby="home-title"
      >
        <div style={{ ...styles.width, position: 'relative', zIndex: 2 }}>
          <div
            className="home-hero-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.25fr) minmax(280px, .75fr)',
              gap: 'clamp(28px, 6vw, 76px)',
              alignItems: 'end',
            }}
          >
            <div style={{ maxWidth: 760 }}>
              <p style={styles.eyebrow} data-rise>
                Built for better homes
              </p>

              <h1
                id="home-title"
                data-rise
                style={{
                  margin: '14px 0 20px',
                  maxWidth: 820,
                  color: UI.text,
                  fontSize: 'clamp(2.5rem, 7vw, 6.4rem)',
                  lineHeight: .96,
                  letterSpacing: '-.055em',
                  fontWeight: 700,
                }}
              >
                Everyday hardware,
                <br />
                elevated for modern living.
              </h1>

              <p
                data-rise
                style={{
                  ...styles.body,
                  maxWidth: 650,
                  fontSize: 'clamp(.98rem, 1.8vw, 1.12rem)',
                }}
              >
                Sanitary, drainage, and bathroom essentials that balance
                durability, function, and a cleaner design language for real
                homes and busy routines.
              </p>

              <div
                data-rise
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 14,
                  marginTop: 28,
                }}
              >
                <Link
                  to="/shop"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    minHeight: 48,
                    padding: '0 20px',
                    borderRadius: 12,
                    color: '#0b0b0a',
                    background: UI.gold,
                    fontSize: 13,
                    fontWeight: 850,
                    textDecoration: 'none',
                    boxShadow: '0 12px 30px rgba(216,173,106,.18)',
                  }}
                >
                  Shop products
                  <RiArrowRightLine size={17} />
                </Link>

                <Link
                  to="/shop"
                  style={{
                    ...styles.arrowLink,
                    minHeight: 48,
                    padding: '0 8px',
                    color: UI.text,
                    opacity: .9,
                  }}
                >
                  Browse categories
                  <RiArrowRightLine size={16} />
                </Link>
              </div>
            </div>

            <aside
              data-rise
              aria-label="Store highlights"
              style={{
                ...styles.card,
                display: 'grid',
                gap: 16,
                padding: 'clamp(20px, 3vw, 28px)',
                borderColor: UI.borderGold,
                background:
                  'linear-gradient(180deg, rgba(17,17,15,.86), rgba(15,15,13,.68))',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  width: 'fit-content',
                  padding: '7px 11px',
                  border: `1px solid ${UI.borderGold}`,
                  borderRadius: 999,
                  color: UI.gold,
                  background: 'rgba(216,173,106,.08)',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                }}
              >
                Trusted everyday essentials
              </span>

              <div
                className="home-highlight-stats"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 8,
                }}
              >
                {[
                  ['Everyday', 'hardware essentials'],
                  ['Clear', 'product details'],
                  ['Secure', 'checkout flow'],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    style={{
                      display: 'grid',
                      gap: 4,
                      padding: '12px 9px',
                      border: '1px solid rgba(255,255,255,.07)',
                      borderRadius: 13,
                      background: 'rgba(255,255,255,.025)',
                    }}
                  >
                    <strong style={{ color: UI.text, fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>
                      {value}
                    </strong>
                    <span style={{ color: UI.muted, fontSize: 10, lineHeight: 1.35 }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '78px minmax(0, 1fr)',
                  gap: 13,
                  alignItems: 'center',
                  padding: 12,
                  border: '1px solid rgba(255,255,255,.07)',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,.025)',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 78,
                    height: 78,
                    borderRadius: 13,
                    border: `1px solid ${UI.borderGold}`,
                    background:
                      'linear-gradient(135deg, rgba(216,173,106,.2), rgba(216,173,106,.02)), url("/luviio-hero-background.webp") center/cover no-repeat',
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <p style={{ ...styles.eyebrow, fontSize: 9 }}>Best seller</p>
                  <h3 style={{ margin: '5px 0 3px', color: UI.text, fontSize: 15, lineHeight: 1.2 }}>
                    Everyday hardware
                  </h3>
                  <span style={{ color: UI.muted, fontSize: 11 }}>
                    Selected for everyday use
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section
        data-reveal
        aria-label="Luviio shopping benefits"
        style={{ padding: '16px 0 0' }}
      >
        <div
          style={{
            ...styles.width,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {[
            [RiTruckLine, 'Fast delivery', 'Delivery options shown at checkout'],
            [RiShieldCheckLine, 'Secure checkout', 'Secure payment processing'],
            [RiToolsLine, 'Daily essentials', 'Made for practical use'],
          ].map(([Icon, title, text]) => (
            <div
              key={title}
              style={{
                ...styles.card,
                minHeight: 72,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '15px 17px',
                borderRadius: 16,
                boxShadow: '0 10px 30px rgba(0,0,0,.1)',
              }}
            >
              <Icon size={22} color={UI.gold} aria-hidden="true" />
              <span style={{ minWidth: 0 }}>
                <strong style={{ display: 'block', color: UI.text, fontSize: 13 }}>
                  {title}
                </strong>
                <small style={{ display: 'block', marginTop: 3, color: UI.muted, fontSize: 11, lineHeight: 1.4 }}>
                  {text}
                </small>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.section} data-reveal aria-label="Store overview">
        <div
          className="home-overview-grid"
          style={{
            ...styles.width,
            display: 'grid',
            gridTemplateColumns: '1.35fr 1fr 1fr',
            gap: 16,
          }}
        >
          <article
            style={{
              ...styles.card,
              minHeight: 175,
              padding: 'clamp(22px, 3vw, 32px)',
              background:
                'linear-gradient(135deg, rgba(216,173,106,.13), rgba(255,255,255,.025))',
              borderColor: UI.borderGold,
            }}
          >
            <p style={styles.eyebrow}>Curated essentials</p>
            <h2 style={{ ...styles.heading, fontSize: 'clamp(1.4rem, 2.5vw, 2.15rem)' }}>
              Reliable product categories for modern homes.
            </h2>
            <p style={{ ...styles.body, marginTop: 12 }}>
              Keep everyday routines smooth with solutions that perform and look clean in real spaces.
            </p>
          </article>

          {[
            ['Smart buying', 'Clear product pricing and order totals.'],
            ['Professional standards', 'Order flow with payment and tracking updates.'],
          ].map(([eyebrow, title]) => (
            <article
              key={eyebrow}
              style={{
                ...styles.card,
                minHeight: 175,
                padding: 'clamp(22px, 3vw, 28px)',
                display: 'grid',
                alignContent: 'space-between',
                gap: 18,
              }}
            >
              <p style={styles.eyebrow}>{eyebrow}</p>
              <h3 style={{ margin: 0, color: UI.text, fontSize: 'clamp(1.15rem, 2vw, 1.55rem)', lineHeight: 1.25 }}>
                {title}
              </h3>
            </article>
          ))}
        </div>
      </section>

      <section
        style={styles.section}
        data-reveal
        aria-labelledby="featured-title"
      >
        <div style={styles.width}>
          <div
            style={{
              display: 'flex',
              alignItems: 'end',
              justifyContent: 'space-between',
              gap: 20,
              marginBottom: 24,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p style={styles.eyebrow}>From the store</p>
              <h2 id="featured-title" style={styles.heading}>Featured products</h2>
            </div>

            <Link to="/shop" style={styles.arrowLink}>
              View all products
              <RiArrowRightLine size={17} />
            </Link>
          </div>

          {error ? (
            <ErrorState message={error} onRetry={loadStore} />
          ) : products === null ? (
            <ProductSkeletons count={4} />
          ) : products.length === 0 ? (
            <div
              style={{
                ...styles.card,
                display: 'grid',
                placeItems: 'center',
                gap: 14,
                minHeight: 220,
                padding: 28,
                textAlign: 'center',
              }}
            >
              <p style={styles.body}>
                The catalogue is currently empty. Check back soon for new products.
              </p>
              <Link
                to="/shop"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 42,
                  padding: '0 16px',
                  borderRadius: 11,
                  color: '#0b0b0a',
                  background: UI.gold,
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                Browse shop
              </Link>
            </div>
          ) : (
            <div
              role="region"
              aria-label="Featured products"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 245px), 1fr))',
                gap: 'clamp(14px, 2vw, 20px)',
                alignItems: 'stretch',
              }}
            >
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id || product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {categories !== null && categories.length > 0 && (
        <section
          style={styles.section}
          data-reveal
          aria-labelledby="category-title"
        >
          <div style={styles.width}>
            <div
              style={{
                display: 'flex',
                alignItems: 'end',
                justifyContent: 'space-between',
                gap: 20,
                marginBottom: 24,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <p style={styles.eyebrow}>Browse the catalogue</p>
                <h2 id="category-title" style={styles.heading}>Shop by category</h2>
              </div>

              <Link to="/shop" style={styles.arrowLink}>
                View shop
                <RiArrowRightLine size={17} />
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                gap: 12,
              }}
            >
              {categories.map((category) => {
                const categoryName = String(category?.name || '').trim();
                const categorySlug = String(category?.slug || '').trim();

                if (!categoryName || !categorySlug) return null;

                const Icon = categoryIcon(categoryName);

                return (
                  <Link
                    key={category.id || category.slug}
                    to={`/shop?category=${encodeURIComponent(categorySlug)}`}
                    style={{
                      ...styles.card,
                      display: 'grid',
                      gridTemplateColumns: '42px minmax(0, 1fr) 20px',
                      alignItems: 'center',
                      gap: 12,
                      minHeight: 82,
                      padding: '14px 16px',
                      color: UI.text,
                      textDecoration: 'none',
                      borderRadius: 16,
                      transition: 'transform 180ms ease, border-color 180ms ease, background 180ms ease',
                    }}
                  >
                    <span
                      style={{
                        width: 42,
                        height: 42,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 13,
                        color: UI.gold,
                        background: 'rgba(216,173,106,.08)',
                        border: `1px solid ${UI.borderGold}`,
                      }}
                    >
                      <Icon size={23} aria-hidden="true" />
                    </span>
                    <span style={{ minWidth: 0, fontSize: 13, fontWeight: 750 }}>
                      {categoryName}
                    </span>
                    <RiArrowRightLine size={17} color={UI.muted} aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section
        style={styles.section}
        data-reveal
        aria-labelledby="value-title"
      >
        <div
          className="home-value-grid"
          style={{
            ...styles.width,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, .8fr)',
            gap: 20,
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              ...styles.card,
              padding: 'clamp(24px, 4vw, 40px)',
              background:
                'linear-gradient(135deg, rgba(255,255,255,.045), rgba(255,255,255,.012))',
            }}
          >
            <p style={styles.eyebrow}>Built for everyday use</p>
            <h2 id="value-title" style={styles.heading}>
              Thoughtful products. Professional standards.
            </h2>
            <p style={{ ...styles.body, maxWidth: 650, marginTop: 16 }}>
              We focus on the essentials that make a home function better every day — reliable
              sanitary fittings, efficient drainage systems, and bathroom hardware that performs.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {[
              [RiShieldCheckLine, 'Verified checkout', 'Secure payment flow and order tracking'],
              [RiTruckLine, 'Local-friendly delivery', 'Courier rates and order updates'],
              [RiPriceTag3Line, 'Clear pricing', 'Product-level GST and backend-calculated totals'],
            ].map(([Icon, title, text]) => (
              <div
                key={title}
                style={{
                  ...styles.card,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 13,
                  padding: 18,
                  borderRadius: 16,
                  boxShadow: 'none',
                }}
              >
                <Icon size={22} color={UI.gold} aria-hidden="true" />
                <span style={{ display: 'grid', gap: 4 }}>
                  <strong style={{ color: UI.text, fontSize: 13 }}>{title}</strong>
                  <small style={{ color: UI.muted, lineHeight: 1.45 }}>{text}</small>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
