import { useCallback, useEffect, useRef, useState } from 'react';
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

const FEATURED_PRODUCT_LIMIT = 4;

function categoryIcon(name) {
  return (
    CATEGORY_ICONS[String(name || '').trim().toLowerCase()] ||
    RiGridLine
  );
}

function normalizeProducts(value) {
  const items = Array.isArray(value) ? value : value?.items;

  if (!Array.isArray(items)) return [];

  return items.filter(
    (product) =>
      product &&
      typeof product === 'object' &&
      (product.id || product.slug),
  );
}

function normalizeCategories(value) {
  const items = Array.isArray(value)
    ? value
    : Array.isArray(value?.items)
      ? value.items
      : [];

  const seen = new Set();

  return items.filter((category) => {
    if (
      !category ||
      typeof category !== 'object' ||
      !category.slug ||
      !category.name
    ) {
      return false;
    }

    const key = String(category.id || category.slug).trim().toLowerCase();

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export default function HomePage() {
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState('');

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadStore = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setError('');

    try {
      const [productData, categoryData] = await Promise.all([
        productService.list({
          page: 1,
          page_size: 8,
        }),
        productService.categories(),
      ]);

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setProducts(normalizeProducts(productData));
      setCategories(normalizeCategories(categoryData));
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setError(
        err?.message || 'Unable to load the store. Please try again.',
      );
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    loadStore();

    return () => {
      mountedRef.current = false;
    };
  }, [loadStore]);

  return (
    <main className="min-w-0 bg-bg text-text">
      <section
        className="relative isolate min-h-[620px] overflow-hidden border-b border-line bg-bg sm:min-h-[680px] lg:min-h-[calc(100svh-5rem)]"
        aria-labelledby="home-title"
      >
        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#080808_0%,rgba(8,8,8,.94)_26%,rgba(8,8,8,.50)_58%,rgba(8,8,8,.18)_100%),url('/luviio-hero-background.webp')] bg-cover bg-center bg-no-repeat opacity-90"
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg/10 via-bg/25 to-bg/80" aria-hidden="true" />

        <div className="mx-auto flex min-h-[620px] w-full max-w-7xl items-center px-4 py-20 sm:min-h-[680px] sm:px-6 lg:min-h-[calc(100svh-5rem)] lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold" data-rise>
              Hardware <span className="text-dim">/</span> Sanitary <span className="text-dim">/</span> Drainage
            </p>
            <h1 id="home-title" className="mt-5 max-w-[12ch] font-display text-5xl font-semibold leading-[0.94] tracking-[-0.045em] text-text sm:text-6xl lg:text-8xl" data-rise>
              Built for <em className="font-display not-italic text-gold-soft">everyday.</em>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg" data-rise>
              Practical hardware and sanitary solutions for cleaner, safer and better Indian homes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center" data-rise>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-sm font-bold text-gold-ink transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                to="/shop"
              >
                Shop products
                <RiArrowRightLine size={17} aria-hidden="true" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-line bg-bg/60 px-5 text-sm font-semibold text-text backdrop-blur-sm transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                to="/shop"
              >
                Explore categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface" aria-label="Luviio shopping benefits" data-reveal>
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 divide-y divide-line px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
          {[
            [RiTruckLine, 'Shipping from ₹45.90', 'Free above ₹1,499'],
            [RiShieldCheckLine, 'Secure checkout', 'Protected online payments'],
            [RiToolsLine, 'Useful products', 'Made for daily use'],
          ].map(([Icon, title, detail]) => (
            <div key={title} className="flex items-center gap-4 px-2 py-5 sm:px-5 lg:py-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface-2 text-gold">
                <Icon size={21} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm font-semibold text-text">{title}</strong>
                <small className="mt-1 block text-xs text-muted">{detail}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20" data-reveal aria-labelledby="featured-title">
        <div className="mb-7 flex items-end justify-between gap-4 sm:mb-9">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">From the store</p>
            <h2 id="featured-title" className="mt-2 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">Featured products</h2>
          </div>
          <Link className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-gold transition hover:text-gold-soft sm:inline-flex" to="/shop">
            View all products <RiArrowRightLine size={17} aria-hidden="true" />
          </Link>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={loadStore} />
        ) : products === null ? (
          <div role="status" aria-live="polite" aria-label="Loading featured products">
            <ProductSkeletons count={FEATURED_PRODUCT_LIMIT} />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-line bg-surface px-5 py-10 text-center">
            <p className="text-sm leading-6 text-muted">The catalogue is currently empty. Check back soon for new products.</p>
            <Link className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold text-text transition hover:border-gold hover:text-gold" to="/shop">
              Browse shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {products.slice(0, FEATURED_PRODUCT_LIMIT).map((product) => (
              <ProductCard key={product.id || product.slug} product={product} />
            ))}
          </div>
        )}

        <Link className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gold sm:hidden" to="/shop">
          View all products <RiArrowRightLine size={17} aria-hidden="true" />
        </Link>
      </section>

      {categories !== null && categories.length > 0 && (
        <section className="border-y border-line bg-surface" data-reveal aria-labelledby="category-title">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Browse the catalogue</p>
                <h2 id="category-title" className="mt-2 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">Shop by category</h2>
              </div>
              <Link className="hidden items-center gap-1.5 text-sm font-semibold text-gold sm:inline-flex" to="/shop">
                View shop <RiArrowRightLine size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((category) => {
                const Icon = categoryIcon(category.name);
                return (
                  <Link
                    key={category.id || category.slug}
                    className="group flex min-h-36 flex-col justify-between rounded-2xl border border-line bg-bg p-4 transition hover:-translate-y-0.5 hover:border-gold hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    to={`/shop?category=${encodeURIComponent(String(category.slug))}`}
                  >
                    <Icon size={28} strokeWidth={1.25} className="text-gold" aria-hidden="true" />
                    <span className="flex items-end justify-between gap-2 text-sm font-semibold text-text">
                      <span className="break-words">{category.name}</span>
                      <RiArrowRightLine size={16} className="shrink-0 text-muted transition group-hover:text-gold" aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8" data-reveal aria-labelledby="value-title">
        <div className="grid gap-8 rounded-3xl border border-line bg-surface p-6 sm:p-8 lg:grid-cols-[1.2fr_.8fr] lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Made for everyday Indian homes</p>
            <h2 id="value-title" className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">The small hardware details matter.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              From drainage that works quietly to sanitary and bathroom fittings that hold up to daily use, Luviio focuses on practical products you can trust.
            </p>
            <Link className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:text-gold-soft" to="/shop">
              Explore useful upgrades <RiArrowRightLine size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3">
            {[
              [RiShieldCheckLine, 'Verified checkout', 'Secure payment flow and order tracking'],
              [RiTruckLine, 'Local-friendly delivery', 'Manual shipping and order updates'],
              [RiPriceTag3Line, 'Clear pricing', 'Product-level GST and backend-calculated totals'],
            ].map(([Icon, title, detail]) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-line bg-bg p-4">
                <Icon className="mt-0.5 shrink-0 text-gold" size={21} aria-hidden="true" />
                <span>
                  <strong className="block text-sm text-text">{title}</strong>
                  <small className="mt-1 block text-xs leading-5 text-muted">{detail}</small>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
