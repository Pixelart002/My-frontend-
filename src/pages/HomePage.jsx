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
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { productService } from '../services/products';
import ProductCard from '../components/ProductCard';
import { ProductSkeletons, ErrorState } from '../components/ui/States';
import '../styles/marketing.css';

gsap.registerPlugin(ScrollTrigger);

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
      setProducts(Array.isArray(data) ? data : data?.items || []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
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

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-rise]',
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.08, ease: 'power3.out' },
      );

      gsap.utils.toArray('[data-reveal]').forEach((el) =>
        gsap.fromTo(
          el,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          },
        ),
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <main className="home-landing">
      {/* 01 — Orientation + primary conversion */}
      <section className="hero hero-reference" aria-labelledby="home-title">
        <div className="hero-reference-image" aria-hidden="true" />
        <div className="hero-reference-inner">
          <div className="hero-reference-copy">
            <p className="eyebrow" data-rise>
              Hardware&nbsp;&nbsp;/&nbsp;&nbsp; Sanitary&nbsp;&nbsp;/&nbsp;&nbsp; Drainage
            </p>
            <h1 id="home-title" data-rise>
              Built for<br />
              <em>everyday.</em>
            </h1>
            <p className="hero-text" data-rise>
              Practical hardware and sanitary solutions for cleaner, safer and better
              Indian homes.
            </p>
            <div className="hero-actions" data-rise>
              <Link className="btn hero-reference-btn" to="/shop">
                Shop products <RiArrowRightLine size={17} />
              </Link>
              <Link className="home-secondary-link" to="/shop">
                Explore categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — Immediate trust / commercial facts */}
      <section className="home-trust-strip" aria-label="Luviio shopping benefits" data-reveal>
        <div className="home-content-width home-trust-grid">
          <div>
            <RiTruckLine size={22} aria-hidden="true" />
            <span><strong>Free shipping</strong><small>Orders above ₹1,499</small></span>
          </div>
          <div>
            <RiShieldCheckLine size={22} aria-hidden="true" />
            <span><strong>Secure checkout</strong><small>Protected online payments</small></span>
          </div>
          <div>
            <RiToolsLine size={22} aria-hidden="true" />
            <span><strong>Useful products</strong><small>Made for daily use</small></span>
          </div>
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
            <div className="products-grid products-grid-4">
              {products.slice(0, 4).map((product) => (
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
                const Icon = categoryIcon(category.name);
                return (
                  <Link
                    key={category.id || category.slug}
                    className="home-category-card"
                    to={`/shop?category=${encodeURIComponent(category.slug)}`}
                  >
                    <Icon className="home-category-icon" size={34} strokeWidth={1.25} />
                    <span>{category.name}</span>
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
            <p className="eyebrow">Made for everyday Indian homes</p>
            <h2 id="value-title" className="section-title">
              The small hardware details matter.
            </h2>
            <p>
              From drainage that works quietly to sanitary and bathroom fittings that
              hold up to daily use, Luviio focuses on practical products you can trust.
            </p>
            <Link className="section-view-all" to="/shop">
              Explore useful upgrades <RiArrowRightLine size={17} />
            </Link>
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
