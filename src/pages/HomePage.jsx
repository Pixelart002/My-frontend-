import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiArrowRightLine,
  RiDropLine,
  RiGridLine,
  RiHomeGearLine,
  RiPriceTag3Line,
  RiShieldCheckLine,
  RiToolsLine,
  RiTruckLine,
  RiWaterFlashLine,
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
  return CATEGORY_ICONS[String(name || '').trim().toLowerCase()] || RiGridLine;
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

const BENEFITS = [
  [RiTruckLine, 'Shipping from ₹45.90', 'Free delivery above ₹1,499'],
  [RiShieldCheckLine, 'Secure checkout', 'Protected payment flow'],
  [RiToolsLine, 'Built for daily use', 'Practical hardware & sanitary'],
];

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
        productService.list({ page: 1, page_size: 8 }),
        productService.categories(),
      ]);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setProducts(normalizeProducts(productData));
      setCategories(normalizeCategories(categoryData));
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setError(err?.message || 'Unable to load the store. Please try again.');
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
    <main className="min-w-0 overflow-hidden bg-bg text-text">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-line" aria-labelledby="home-title">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: "url('/luviio-hero-background.webp')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#080808_4%,rgba(8,8,8,.96)_35%,rgba(8,8,8,.72)_65%,rgba(8,8,8,.35)_100%)]" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_42%,rgba(216,173,106,.18),transparent_34%)]" aria-hidden="true" />

        <div className="mx-auto grid min-h-[680px] w-full max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-black/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.18em] text-gold backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
              Welcome to Luviio
            </div>

            <h1 id="home-title" className="mt-6 max-w-[11ch] font-display text-[3.5rem] font-semibold leading-[.92] tracking-[-.05em] text-text sm:text-6xl lg:text-8xl">
              Everyday hardware, <span className="text-gold-soft">done right.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg">
              Hardware, sanitary and drainage products for homes, shops and everyday projects — with clear pricing and a straightforward buying experience.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/shop"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gold px-6 text-sm font-bold text-gold-ink transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                Shop the collection
                <RiArrowRightLine size={18} aria-hidden="true" />
              </Link>
              <Link
                to="/shop"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 text-sm font-semibold text-text backdrop-blur transition hover:border-gold/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                Browse categories
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
              <span>GST-inclusive product pricing</span>
              <span className="hidden h-1 w-1 rounded-full bg-dim sm:block" aria-hidden="true" />
              <span>Manual shipping</span>
              <span className="hidden h-1 w-1 rounded-full bg-dim sm:block" aria-hidden="true" />
              <span>Secure checkout</span>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative ml-auto aspect-[4/5] max-w-[470px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 shadow-luviio-image backdrop-blur-[2px]">
              <img
                src="/luviio-hero-scene.svg"
                alt="Luviio hardware and sanitary product scene"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-black/65 p-4 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-gold">Luviio essentials</p>
                <p className="mt-1 text-sm font-semibold text-text">Small details. Better everyday living.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-line bg-surface" aria-label="Luviio benefits">
        <div className="mx-auto grid w-full max-w-7xl divide-y divide-line px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
          {BENEFITS.map(([Icon, title, detail]) => (
            <div key={title} className="flex items-center gap-4 px-1 py-5 sm:px-6 lg:py-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface-2 text-gold">
                <Icon size={21} aria-hidden="true" />
              </span>
              <span>
                <strong className="block text-sm font-semibold text-text">{title}</strong>
                <small className="mt-1 block text-xs text-muted">{detail}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20" aria-labelledby="featured-title">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-gold">Shop Luviio</p>
            <h2 id="featured-title" className="mt-2 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">Featured essentials</h2>
            <p className="mt-2 max-w-lg text-sm text-muted">Useful products selected from the live catalogue.</p>
          </div>
          <Link className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-gold hover:text-gold-soft sm:inline-flex" to="/shop">
            View all <RiArrowRightLine size={17} aria-hidden="true" />
          </Link>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={loadStore} />
        ) : products === null ? (
          <div role="status" aria-live="polite" aria-label="Loading featured products">
            <ProductSkeletons count={FEATURED_PRODUCT_LIMIT} />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-line bg-surface px-5 py-12 text-center">
            <p className="text-sm text-muted">The catalogue is currently empty. Check back soon for new products.</p>
            <Link className="mt-5 inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-sm font-semibold text-text hover:border-gold hover:text-gold" to="/shop">
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

      {/* Categories */}
      {categories !== null && categories.length > 0 && (
        <section className="border-y border-line bg-surface" aria-labelledby="category-title">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mb-8 flex items-end justify-between gap-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-gold">Explore</p>
                <h2 id="category-title" className="mt-2 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">Shop by category</h2>
              </div>
              <Link className="hidden items-center gap-1.5 text-sm font-semibold text-gold sm:inline-flex" to="/shop">
                Full catalogue <RiArrowRightLine size={17} aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((category) => {
                const Icon = categoryIcon(category.name);
                return (
                  <Link
                    key={category.id || category.slug}
                    to={`/shop?category=${encodeURIComponent(String(category.slug))}`}
                    className="group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-2xl border border-line bg-bg p-5 transition duration-200 hover:-translate-y-1 hover:border-gold/70 hover:shadow-luviio-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gold/5 transition group-hover:bg-gold/10" aria-hidden="true" />
                    <Icon size={28} strokeWidth={1.25} className="relative text-gold" aria-hidden="true" />
                    <span className="relative flex items-end justify-between gap-2 text-sm font-semibold text-text">
                      <span>{category.name}</span>
                      <RiArrowRightLine size={16} className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-gold" aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Value proposition */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24" aria-labelledby="value-title">
        <div className="grid overflow-hidden rounded-[2rem] border border-line bg-surface lg:grid-cols-[1.05fr_.95fr]">
          <div className="p-7 sm:p-10 lg:p-14">
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-gold">Why Luviio</p>
            <h2 id="value-title" className="mt-3 max-w-xl font-display text-3xl font-semibold leading-tight tracking-tight text-text sm:text-5xl">
              The hardware you notice only when it works.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-muted sm:text-base">
              We keep the shopping experience simple: practical products, transparent pricing, backend-calculated totals and a checkout designed for everyday use.
            </p>
            <Link
              to="/shop"
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-5 text-sm font-semibold text-text transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Explore the shop
              <RiArrowRightLine size={17} aria-hidden="true" />
            </Link>
          </div>

          <div className="grid border-t border-line bg-bg sm:grid-cols-3 lg:grid-cols-1 lg:border-l lg:border-t-0">
            {[
              [RiShieldCheckLine, 'Secure buying', 'Protected account and payment flow.'],
              [RiPriceTag3Line, 'Clear totals', 'Product GST and totals come from the backend.'],
              [RiTruckLine, 'Straightforward shipping', '₹45.90 below ₹1,499, free above it.'],
            ].map(([Icon, title, detail]) => (
              <div key={title} className="flex gap-4 border-b border-line p-6 last:border-b-0 lg:p-7">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-gold">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span>
                  <strong className="block text-sm font-semibold text-text">{title}</strong>
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
