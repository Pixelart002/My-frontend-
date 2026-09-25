import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useSearchParams,
} from 'react-router-dom';
import {
  RiCloseLine,
  RiEqualizerLine,
  RiLoader4Line,
  RiSearchLine,
} from '@remixicon/react';
import { productService } from '../services/products';
import ProductCard from '../components/ProductCard';
import {
  EmptyState,
  ErrorState,
  ProductSkeletons,
} from '../components/ui/States';

const PAGE_SIZE = 20;
const MAX_PRICE = 999999999;

function text(value, fallback = '') {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const result = String(value).trim();

  return result || fallback;
}

function normalizeResponse(response) {
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.items)
      ? response.items
      : [];

  return {
    items: items.filter(
      (item) =>
        item &&
        typeof item === 'object',
    ),
    meta:
      response?.meta &&
      typeof response.meta === 'object'
        ? response.meta
        : {},
  };
}

function normalizeCategories(value) {
  const items = Array.isArray(value)
    ? value
    : Array.isArray(value?.items)
      ? value.items
      : [];

  return items.filter(
    (item) =>
      item &&
      typeof item === 'object' &&
      text(item.slug),
  );
}

function normalizePrice(value) {
  const normalized =
    String(value ?? '').trim();

  if (!normalized) {
    return '';
  }

  const number = Number(normalized);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return '';
  }

  return String(
    Math.floor(number),
  );
}

function getPage(meta) {
  const page = Number(meta?.page);

  return Number.isInteger(page) &&
    page > 0
    ? page
    : 1;
}

function getTotalPages(meta) {
  const total = Number(
    meta?.total_pages,
  );

  return Number.isInteger(total) &&
    total > 0
    ? total
    : 1;
}

function productKey(product, index) {
  return (
    text(product?.id) ||
    text(product?.slug) ||
    `product-${index}`
  );
}

function sortNewestFirst(items) {
  return [...items].sort(
    (a, b) => {
      const aTime =
        Date.parse(
          a?.created_at ||
            a?.createdAt ||
            '',
        ) || 0;

      const bTime =
        Date.parse(
          b?.created_at ||
            b?.createdAt ||
            '',
        ) || 0;

      return bTime - aTime;
    },
  );
}

export default function ShopPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const [categories, setCategories] =
    useState([]);

  const [data, setData] =
    useState(null);

  const [error, setError] =
    useState('');

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [minPrice, setMinPrice] =
    useState(
      searchParams.get(
        'min_price',
      ) || '',
    );

  const [maxPrice, setMaxPrice] =
    useState(
      searchParams.get(
        'max_price',
      ) || '',
    );

  const [showFilters, setShowFilters] =
    useState(false);

  const loadMoreRef =
    useRef(null);

  const loadingMoreRef =
    useRef(false);

  const mountedRef =
    useRef(false);

  const requestVersionRef =
    useRef(0);

  const loadMoreVersionRef =
    useRef(0);

  const q = text(
    searchParams.get('q'),
  );

  const category = text(
    searchParams.get('category'),
  );

  const inStockOnly =
    searchParams.get(
      'in_stock',
    ) === '1';

  const isNew =
    searchParams.get('new') === '1';

  useEffect(() => {
    mountedRef.current = true;

    let active = true;

    productService
      .categories()
      .then((result) => {
        if (!active) {
          return;
        }

        setCategories(
          normalizeCategories(
            result,
          ),
        );
      })
      .catch(() => {
        if (active) {
          setCategories([]);
        }
      });

    return () => {
      active = false;
      mountedRef.current = false;
      requestVersionRef.current += 1;
      loadMoreVersionRef.current += 1;
    };
  }, []);

  useEffect(() => {
    setMinPrice(
      searchParams.get(
        'min_price',
      ) || '',
    );

    setMaxPrice(
      searchParams.get(
        'max_price',
      ) || '',
    );
  }, [searchParams]);

  const buildParams = useCallback(
    (page) => {
      const params = {
        page,
        page_size: PAGE_SIZE,
      };

      if (q) {
        params.search = q;
      }

      if (category) {
        params.category = category;
      }

      if (inStockOnly) {
        params.in_stock = true;
      }

      const normalizedMin =
        normalizePrice(minPrice);

      const normalizedMax =
        normalizePrice(maxPrice);

      if (normalizedMin) {
        params.min_price =
          Number(normalizedMin);
      }

      if (normalizedMax) {
        params.max_price =
          Number(normalizedMax);
      }

      return params;
    },
    [
      q,
      category,
      inStockOnly,
      minPrice,
      maxPrice,
    ],
  );

  const loadProducts =
    useCallback(async () => {
      const requestVersion =
        ++requestVersionRef.current;

      loadingMoreRef.current = false;
      loadMoreVersionRef.current += 1;

      if (mountedRef.current) {
        setLoadingMore(false);
        setData(null);
        setError('');
      }

      try {
        const result =
          await productService.list(
            buildParams(1),
          );

        if (
          !mountedRef.current ||
          requestVersion !==
            requestVersionRef.current
        ) {
          return;
        }

        setData(
          normalizeResponse(result),
        );
      } catch (err) {
        if (
          !mountedRef.current ||
          requestVersion !==
            requestVersionRef.current
        ) {
          return;
        }

        setData(null);
        setError(
          err?.message ||
            'Unable to load products.',
        );
      }
    }, [buildParams]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const meta = data?.meta || {};

  const currentPage =
    getPage(meta);

  const totalPages =
    getTotalPages(meta);

  const hasMore =
    currentPage < totalPages;

  const loadMore =
    useCallback(async () => {
      if (
        !data ||
        !hasMore ||
        loadingMoreRef.current
      ) {
        return;
      }

      const requestVersion =
        requestVersionRef.current;

      const loadVersion =
        ++loadMoreVersionRef.current;

      loadingMoreRef.current = true;

      if (mountedRef.current) {
        setLoadingMore(true);
        setError('');
      }

      try {
        const result =
          await productService.list(
            buildParams(
              currentPage + 1,
            ),
          );

        if (
          !mountedRef.current ||
          requestVersion !==
            requestVersionRef.current ||
          loadVersion !==
            loadMoreVersionRef.current
        ) {
          return;
        }

        const next =
          normalizeResponse(result);

        setData((previous) => {
          if (!previous) {
            return next;
          }

          const seen = new Set(
            previous.items.map(
              (item, index) =>
                productKey(
                  item,
                  index,
                ),
            ),
          );

          const appended =
            next.items.filter(
              (item, index) => {
                const key =
                  productKey(
                    item,
                    index,
                  );

                if (seen.has(key)) {
                  return false;
                }

                seen.add(key);
                return true;
              },
            );

          return {
            ...next,
            items: [
              ...previous.items,
              ...appended,
            ],
          };
        });
      } catch (err) {
        if (
          !mountedRef.current ||
          requestVersion !==
            requestVersionRef.current ||
          loadVersion !==
            loadMoreVersionRef.current
        ) {
          return;
        }

        setError(
          err?.message ||
            'Unable to load more products.',
        );
      } finally {
        if (
          loadVersion ===
          loadMoreVersionRef.current
        ) {
          loadingMoreRef.current = false;

          if (
            mountedRef.current
          ) {
            setLoadingMore(false);
          }
        }
      }
    }, [
      data,
      hasMore,
      buildParams,
      currentPage,
    ]);

  useEffect(() => {
    const target =
      loadMoreRef.current;

    if (
      !target ||
      !hasMore
    ) {
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          if (
            entries[0]?.isIntersecting
          ) {
            loadMore();
          }
        },
        {
          rootMargin:
            '320px 0px',
        },
      );

    observer.observe(target);

    return () =>
      observer.disconnect();
  }, [
    hasMore,
    loadMore,
  ]);

  const setParam = useCallback(
    (key, value) => {
      const next =
        new URLSearchParams(
          searchParams,
        );

      const normalized =
        text(value);

      if (normalized) {
        next.set(
          key,
          normalized,
        );
      } else {
        next.delete(key);
      }

      next.delete('page');

      setSearchParams(next);
    },
    [
      searchParams,
      setSearchParams,
    ],
  );

  const clearFilters =
    useCallback(() => {
      setSearchParams({});
      setMinPrice('');
      setMaxPrice('');
    }, [setSearchParams]);

  const applyPrice = (event) => {
    event.preventDefault();

    const normalizedMin =
      normalizePrice(minPrice);

    const normalizedMax =
      normalizePrice(maxPrice);

    if (
      normalizedMin &&
      normalizedMax &&
      Number(normalizedMin) >
        Number(normalizedMax)
    ) {
      setError(
        'Minimum price cannot be greater than maximum price.',
      );
      return;
    }

    setError('');

    const next =
      new URLSearchParams(
        searchParams,
      );

    next.delete('page');

    if (normalizedMin) {
      next.set(
        'min_price',
        normalizedMin,
      );
    } else {
      next.delete('min_price');
    }

    if (normalizedMax) {
      next.set(
        'max_price',
        normalizedMax,
      );
    } else {
      next.delete('max_price');
    }

    setSearchParams(next);
  };

  const items = useMemo(() => {
    const list =
      data?.items || [];

    return isNew
      ? sortNewestFirst(list)
      : list;
  }, [data, isNew]);

  const hasActiveFilters =
    Boolean(
      q ||
      category ||
      inStockOnly ||
      minPrice ||
      maxPrice ||
      isNew,
    );

  return (
    <div className="page container mx-auto w-full max-w-[1440px] px-[clamp(16px,8vw,120px)] pb-[clamp(64px,9vw,120px)] pt-[clamp(48px,7vw,96px)] max-[760px]:px-[18px] max-[760px]:pt-10 max-[760px]:pb-16 max-[480px]:px-4 max-[480px]:pt-8">
      <div className="page-heading mb-8 min-w-0 max-w-[760px]">
        <p className="eyebrow mb-4 text-[11px] font-medium uppercase tracking-[.2em] text-gold">
          The collection
        </p>

        <h1>
          Everyday, <em>elevated.</em>
        </h1>

        <p>
          Practical hardware, sanitary
          and drainage products for the
          spaces you use every day.
        </p>
      </div>

      <div className="shop-toolbar mb-6 flex min-w-0 items-center justify-between gap-3 max-[640px]:flex-wrap">
        <form
          className="shop-search flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 transition-colors focus-within:border-gold focus-within:ring-2 focus-within:ring-[rgba(216,173,106,.10)] [&_input]:min-w-0 [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input]:placeholder:text-dim [&_button]:inline-flex [&_button]:h-10 [&_button]:w-10 [&_button]:shrink-0 [&_button]:items-center [&_button]:justify-center [&_button]:rounded-lg [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-muted [&_button]:transition-colors [&_button:hover]:bg-surface-2 [&_button:hover]:text-gold [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-gold"
          onSubmit={(event) => {
            event.preventDefault();

            const value =
              event.currentTarget.q.value.trim();

            setParam('q', value);
          }}
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Search products…"
            aria-label="Search products"
            type="search"
            autoComplete="off"
            spellCheck={false}
          />

          <button
            type="submit"
            aria-label="Search"
          >
            <RiSearchLine
              size={18}
              aria-hidden="true"
            />
          </button>
        </form>

        <button
          type="button"
          className="filter-toggle inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-line bg-transparent px-3.5 text-xs font-semibold text-text transition-colors hover:border-gold hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold max-[480px]:flex-1 max-[480px]:justify-center"
          onClick={() =>
            setShowFilters(
              (value) => !value,
            )
          }
          aria-expanded={
            showFilters
          }
          aria-controls="shop-filters"
        >
          <RiEqualizerLine
            size={16}
            aria-hidden="true"
          />
          Filters
        </button>
      </div>

      {showFilters && (
        <div
          id="shop-filters"
          className="filter-panel mt-3 grid min-w-0 grid-cols-[repeat(3,minmax(0,1fr))] gap-4 rounded-2xl border border-line bg-surface p-4 shadow-luviio-card max-[900px]:grid-cols-1 max-[560px]:p-3"
        >
          <div className="filter-group min-w-0 rounded-xl border border-line-soft bg-surface-2/40 p-4">
            <span className="filter-label mb-2.5 block text-[11px] font-semibold uppercase tracking-[.16em] text-muted">
              Category
            </span>

            <div
              className="chip-row flex min-w-0 flex-wrap gap-2"
              role="group"
              aria-label="Product category"
            >
              <button
                type="button"
                className={`chip inline-flex min-h-10 items-center justify-center rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${!category ? 'border-gold bg-gold-dim text-gold-soft' : 'border-line bg-bg text-muted hover:border-gold hover:text-text'}`}
                aria-pressed={!category}
                onClick={() =>
                  setParam(
                    'category',
                    '',
                  )
                }
              >
                All
              </button>

              {categories.map(
                (item, index) => {
                  const slug =
                    text(
                      item.slug,
                    );

                  const id =
                    text(
                      item.id,
                    ) ||
                    slug ||
                    `category-${index}`;

                  return (
                    <button
                      type="button"
                      key={id}
                      className={`chip inline-flex min-h-10 items-center justify-center rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${category === slug ? 'border-gold bg-gold-dim text-gold-soft' : 'border-line bg-bg text-muted hover:border-gold hover:text-text'}`}
                      aria-pressed={
                        category ===
                        slug
                      }
                      onClick={() =>
                        setParam(
                          'category',
                          slug,
                        )
                      }
                    >
                      {text(
                        item.name,
                        slug,
                      )}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="filter-group min-w-0 rounded-xl border border-line-soft bg-surface-2/40 p-4">
            <span className="filter-label mb-2.5 block text-[11px] font-semibold uppercase tracking-[.16em] text-muted">
              Availability
            </span>

            <label className="check-line inline-flex min-h-11 cursor-pointer select-none items-center gap-2.5 rounded-xl border border-line bg-bg px-3.5 text-sm text-text transition-colors hover:border-[rgba(216,173,106,.60)] has-[:checked]:border-gold has-[:checked]:bg-gold-dim has-[:checked]:text-gold-soft [&_input]:h-4 [&_input]:w-4 [&_input]:accent-gold">
              <input
                type="checkbox"
                checked={
                  inStockOnly
                }
                onChange={(
                  event,
                ) =>
                  setParam(
                    'in_stock',
                    event.target
                      .checked
                      ? '1'
                      : '',
                  )
                }
              />

              In stock only
            </label>
          </div>

          <div className="filter-group min-w-0 rounded-xl border border-line-soft bg-surface-2/40 p-4">
            <span className="filter-label mb-2.5 block text-[11px] font-semibold uppercase tracking-[.16em] text-muted">
              Price
            </span>

            <form
              className="price-row grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2 max-[480px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] [&_input]:h-11 [&_input]:min-w-0 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_button]:h-11 [&_button]:rounded-xl max-[480px]:[&_button]:col-span-3"
              onSubmit={
                applyPrice
              }
              noValidate
            >
              <label className="sr-only">
                Minimum price
              </label>

              <input
                type="number"
                min="0"
                max={MAX_PRICE}
                step="1"
                inputMode="numeric"
                placeholder="Min ₹"
                aria-label="Minimum price"
                value={minPrice}
                onChange={(event) =>
                  setMinPrice(
                    event.target
                      .value,
                  )
                }
              />

              <span aria-hidden="true">
                –
              </span>

              <label className="sr-only">
                Maximum price
              </label>

              <input
                type="number"
                min="0"
                max={MAX_PRICE}
                step="1"
                inputMode="numeric"
                placeholder="Max ₹"
                aria-label="Maximum price"
                value={maxPrice}
                onChange={(event) =>
                  setMaxPrice(
                    event.target
                      .value,
                  )
                }
              />

              <button
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-transparent bg-gold px-3.5 text-xs font-bold text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                type="submit"
              >
                Apply
              </button>
            </form>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <button
          type="button"
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-transparent px-2 text-xs font-medium text-muted transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          onClick={clearFilters}
        >
          <RiCloseLine
            size={14}
            aria-hidden="true"
          />
          Clear all filters
        </button>
      )}

      {error ? (
        <ErrorState
          message={error}
          onRetry={loadProducts}
        />
      ) : data === null ? (
        <ProductSkeletons
          count={PAGE_SIZE}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No products found"
          message="Try adjusting your filters or search terms."
          action={
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-transparent px-3.5 text-xs font-semibold text-text transition-colors hover:border-gold hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              onClick={
                clearFilters
              }
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <div className="products-grid grid min-w-0 grid-cols-2 gap-x-3 gap-y-4 min-[768px]:grid-cols-3 min-[1024px]:grid-cols-4 min-[1280px]:gap-x-4 min-[1280px]:gap-y-5 max-[375px]:grid-cols-1">
            {items.map(
              (product, index) => (
                <ProductCard
                  key={productKey(
                    product,
                    index,
                  )}
                  product={product}
                />
              ),
            )}
          </div>

          {hasMore && (
            <div
              className="shop-load-more flex justify-center px-1 pb-2 pt-10"
              ref={loadMoreRef}
            >
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-transparent px-4 text-sm font-semibold text-text transition-colors hover:border-gold hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                onClick={loadMore}
                disabled={loadingMore}
                aria-label="Load more products"
                aria-busy={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <RiLoader4Line
                      size={17}
                      className="spin animate-spin"
                      aria-hidden="true"
                    />
                    Loading products…
                  </>
                ) : (
                  'Load more'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}