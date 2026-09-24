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
import '../styles/marketing.css';

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
      setError(err.message || 'Unable to load the store.');
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

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([gsapModule, triggerModule]) => {
      if (cancelled) return;
      const gsap = gsapModule.default;
      const ScrollTrigger = triggerModule.ScrollTrigger || triggerModule.default;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.fromTo(
          '[data-rise]',
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, stagger: 0.08, ease: 'power3.out' },
        );
        gsap.utils.toArray('[data-reveal]').forEach((el) =>
          gsap.fromTo(
            el,
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%' } },
          ),
        );
      }, root);
    }).catch(() => {});

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <main className="home-landing">
      <section className="hero hero-reference home-hero-upgraded" aria-labelledby="home-title">
        <div className="hero-reference-image" aria-hidden="true" />
        <div className="hero-reference-inner home-hero-shell">
          <div className="hero-reference-copy">
            <p className="eyebrow" data-rise>Built for better homes</p>
            <h1 id="home-title" data-rise>
              Everyday hardware,<br />
              elevated for modern living.
            </h1>
            <p className="hero-text" data-rise>
              Sanitary, drainage, and bathroom essentials that balance durability,
              function, and a cleaner design language for real homes and busy routines.
            </p>
            <div className="hero-actions" data-rise>
              <Link className="btn hero-reference-btn" to="/shop">
                Shop products <RiArrowRightLine size={17} />
              </Link>
              <Link className="home-secondary-link" to="/shop">
                Browse categories
              </Link>
            </div>
          </div>

          <aside className="home-hero-panel" data-rise aria-label="Store highlights">
            <div className="home-hero-badge">Trusted everyday essentials</div>
            <div className="home-hero-metrics">
              <div>
                <strong>2.4k+</strong>
                <span>homes served</span>
              </div>
              <div>
                <strong>48h</strong>
                <span>dispatch window</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>secure checkout</span>
              </div>
            </div>
            <div className="home-mini-product">
              <div className="mini-product-visual" aria-hidden="true" />
              <div>
                <p>Best seller</p>
                <h3>Premium bathroom fittings</h3>
                <span>Made for daily reliability</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="home-trust-strip" aria-label="Luviio shopping benefits" data-reveal>
        <div className="home-content-width home-trust-grid">
          <div>
            <RiTruckLine size={22} aria-hidden="true" />
            <span><strong>Fast delivery</strong><small>Quick dispatch across India</small></span>
          </div>
          <div>
            <RiShieldCheckLine size={22} aria-hidden="true" />
            <span><strong>Secure checkout</strong><small>Protected online payments</small></span>
          </div>
          <div>
            <RiToolsLine size={22} aria-hidden="true" />
            <span><strong>Daily essentials</strong><small>Made for practical use</small></span>
          </div>
        </div>
      </section>

      <section className="section home-feature-spotlight" data-reveal aria-label="Store overview">
        <div className="home-content-width home-feature-grid">
          <article className="home-feature-card home-feature-card--accent">
            <p className="eyebrow">Curated essentials</p>
            <h2>Reliable product categories for modern homes.</h2>
            <p>Keep everyday routines smooth with solutions that perform and look clean in real spaces.</p>
          </article>
          <article className="home-feature-card">
            <p className="eyebrow">Smart buying</p>
            <h3>Clear pricing, live totals, and dependable fulfilment.</h3>
          </article>
          <article className="home-feature-card">
            <p className="eyebrow">Professional standards</p>
            <h3>Backed by secure payment flow and order tracking.</h3>
          </article>
        </div>
      </section>

      {/* 03 — Primary catalogue discovery */}
      <section className="section home-products-section" data-reveal aria-labelledby="featured-title">
        <div className="home-content-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">From the store</p>
              <h2 id="featured-title" className="section-title">Featured products</h2>
            </div>
            <Link className="section-view-all" to="/shop">
              View all products <RiArrowRightLine size={17} />
            </Link>
          </div>

          {error ? (
            <ErrorState message={error} onRetry={loadStore} />
          ) : products === null ? (
            <ProductSkeletons count={4} />
          ) : products.length === 0 ? (
            <div className="state">
              <p>The catalogue is currently empty. Check back soon for new products.</p>
              <Link className="btn btn-quiet btn-sm" to="/shop">Browse shop</Link>
            </div>
          ) : (
            <div className="products-grid" role="region" aria-label="Featured products">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id || product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 04 — Navigation aid: real catalogue categories only */}
      {categories !== null && categories.length > 0 && (
        <section className="section home-category-section" data-reveal aria-labelledby="category-title">
          <div className="home-content-width">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">Browse the catalogue</p>
                <h2 id="category-title" className="section-title">Shop by category</h2>
              </div>
              <Link className="section-view-all" to="/shop">
                View shop <RiArrowRightLine size={17} />
              </Link>
            </div>

            <div className="home-category-grid">
              {categories.map((category) => {
                const categoryName = String(category?.name || '').trim();
                const categorySlug = String(category?.slug || '').trim();
                if (!categoryName || !categorySlug) return null;
                const Icon = categoryIcon(categoryName);
                return (
                  <Link
                    key={category.id || category.slug}
                    className="home-category-card"
                    to={`/shop?category=${encodeURIComponent(categorySlug)}`}
                  >
                    <Icon className="home-category-icon" size={34} strokeWidth={1.25} />
                    <span>{categoryName}</span>
                    <RiArrowRightLine className="home-category-arrow" size={17} />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 05 — Brand/value explanation after the user has seen products */}
      <section className="section luviio-marketing home-value-section" data-reveal aria-labelledby="value-title">
        <div className="home-content-width home-value-grid">
          <div className="luviio-marketing-copy">
            <p className="eyebrow">Built for everyday use</p>
            <h2 id="value-title" className="section-title">
              Thoughtful products. Professional standards.
            </h2>
            <p>
              We focus on the essentials that make a home function better every day — reliable
              sanitary fittings, efficient drainage systems, and bathroom hardware that performs.
            </p>
          </div>

          <div className="luviio-marketing-points">
            <div>
              <RiShieldCheckLine size={22} />
              <span><strong>Verified checkout</strong><small>Secure payment flow and order tracking</small></span>
            </div>
            <div>
              <RiTruckLine size={22} />
              <span><strong>Local-friendly delivery</strong><small>Courier rates and order updates</small></span>
            </div>
            <div>
              <RiPriceTag3Line size={22} />
              <span><strong>Clear pricing</strong><small>Product-level GST and backend-calculated totals</small></span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
