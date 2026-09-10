import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RiEqualizerLine, RiSearchLine, RiCloseLine, RiLoader4Line } from '@remixicon/react';
import { productService } from '../services/products';
import ProductCard from '../components/ProductCard';
import { ProductSkeletons, ErrorState, EmptyState } from '../components/ui/States';

const PAGE_SIZE = 20;

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [showFilters, setShowFilters] = useState(false);
  const loadMoreRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const inStockOnly = searchParams.get('in_stock') === '1';
  const isNew = searchParams.get('new') === '1';

  useEffect(() => {
    let active = true;
    productService.categories()
      .then((items) => {
        if (active) setCategories(Array.isArray(items) ? items : []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setMinPrice(searchParams.get('min_price') || '');
    setMaxPrice(searchParams.get('max_price') || '');
  }, [searchParams]);

  const buildParams = useCallback((page) => {
    const params = { page, page_size: PAGE_SIZE };
    if (q) params.search = q;
    if (category) params.category = category;
    if (inStockOnly) params.in_stock = true;
    if (minPrice) params.min_price = Number(minPrice);
    if (maxPrice) params.max_price = Number(maxPrice);
    return params;
  }, [q, category, inStockOnly, minPrice, maxPrice]);

  const loadProducts = useCallback(async () => {
    setData(null);
    setError('');
    loadingMoreRef.current = false;
    try {
      setData(await productService.list(buildParams(1)));
    } catch (err) {
      setError(err.message || 'Unable to load products.');
    }
  }, [buildParams]);

  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    loadingMoreRef.current = false;

    (async () => {
      try {
        const res = await productService.list(buildParams(1));
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load products.');
      }
    })();

    return () => { active = false; };
  }, [buildParams]);

  const meta = data?.meta || {};
  const currentPage = Number(meta.page) || 1;
  const totalPages = Math.max(1, Number(meta.total_pages) || 1);
  const hasMore = currentPage < totalPages;

  const loadMore = useCallback(async () => {
    if (!data || !hasMore || loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError('');
    try {
      const next = await productService.list(buildParams(currentPage + 1));
      setData((previous) => {
        if (!previous) return next;
        const previousItems = Array.isArray(previous) ? previous : previous.items || [];
        const nextItems = Array.isArray(next) ? next : next.items || [];
        const seen = new Set(previousItems.map((item) => item.id || item.slug));
        const appended = nextItems.filter((item) => !seen.has(item.id || item.slug));
        return Array.isArray(previous)
          ? [...previousItems, ...appended]
          : { ...next, items: [...previousItems, ...appended] };
      });
    } catch (err) {
      setError(err.message || 'Unable to load more products.');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [data, hasMore, buildParams, currentPage]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '320px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const applyPrice = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    if (minPrice) next.set('min_price', minPrice); else next.delete('min_price');
    if (maxPrice) next.set('max_price', maxPrice); else next.delete('max_price');
    setSearchParams(next);
  };

  const items = useMemo(() => {
    const list = Array.isArray(data) ? data : data?.items || [];
    if (!isNew) return list;
    return [...list].sort((a, b) => {
      const ad = Date.parse(a.created_at || a.createdAt || '') || 0;
      const bd = Date.parse(b.created_at || b.createdAt || '') || 0;
      return bd - ad;
    });
  }, [data, isNew]);
  const hasActiveFilters = Boolean(q || category || inStockOnly || minPrice || maxPrice || isNew);

  return (
    <div className="page container">
      <div className="page-heading"><p className="eyebrow">The collection</p><h1>Everyday, <em>elevated.</em></h1><p>Useful objects and quiet luxuries for the spaces you call home.</p></div>
      <div className="shop-toolbar">
        <form className="shop-search" onSubmit={(e) => { e.preventDefault(); setParam('q', e.currentTarget.q.value.trim()); }}>
          <input name="q" defaultValue={q} placeholder="Search products…" aria-label="Search products" />
          <button type="submit" aria-label="Search"><RiSearchLine size={18} /></button>
        </form>
        <button type="button" className="btn btn-quiet btn-sm filter-toggle" onClick={() => setShowFilters((v) => !v)}><RiEqualizerLine size={16} /> Filters</button>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group"><span className="filter-label">Category</span><div className="chip-row">
            <button type="button" className={`chip ${!category ? 'is-active' : ''}`} onClick={() => setParam('category', '')}>All</button>
            {categories.map((c) => <button type="button" key={c.slug || c.id} className={`chip ${category === c.slug ? 'is-active' : ''}`} onClick={() => setParam('category', c.slug)}>{c.name}</button>)}
          </div></div>
          <div className="filter-group"><span className="filter-label">Availability</span><label className="check-line"><input type="checkbox" checked={inStockOnly} onChange={(e) => setParam('in_stock', e.target.checked ? '1' : '')} /> In stock only</label></div>
          <div className="filter-group"><span className="filter-label">Price</span><form className="price-row" onSubmit={applyPrice}><input type="number" min="0" placeholder="Min ₹" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} /><span>–</span><input type="number" min="0" placeholder="Max ₹" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} /><button className="btn btn-sm" type="submit">Apply</button></form></div>
        </div>
      )}

      {hasActiveFilters && <button type="button" className="clear-filters" onClick={() => { setSearchParams({}); setMinPrice(''); setMaxPrice(''); }}><RiCloseLine size={14} /> Clear all filters</button>}
      {error && data !== null ? <ErrorState message={error} onRetry={loadProducts} /> : data === null ? <ProductSkeletons count={PAGE_SIZE} /> : items.length === 0 ? (
        <EmptyState title="No products found" message="Try adjusting your filters or search terms." action={<button type="button" className="btn btn-quiet btn-sm" onClick={() => { setSearchParams({}); setMinPrice(''); setMaxPrice(''); }}>Clear filters</button>} />
      ) : (
        <>
          <div className="products-grid">{items.map((p) => <ProductCard key={p.id || p.slug} product={p} />)}</div>
          {hasMore && (
            <div className="shop-load-more" ref={loadMoreRef}>
              <button type="button" className="btn btn-quiet" onClick={loadMore} disabled={loadingMore} aria-label="Load more products">
                {loadingMore ? <><RiLoader4Line size={17} className="spin" /> Loading products…</> : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
