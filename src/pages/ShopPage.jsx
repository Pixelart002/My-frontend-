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
    <div className="page container">
      <div className="page-heading">
        <p className="eyebrow">
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

      <div className="shop-toolbar">
        <form
          className="shop-search"
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
          className="btn btn-quiet btn-sm filter-toggle"
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
          className="filter-panel"
        >
          <div className="filter-group">
            <span className="filter-label">
              Category
            </span>

            <div
              className="chip-row"
              role="group"
              aria-label="Product category"
            >
              <button
                type="button"
                className={`chip ${
                  !category
                    ? 'is-active'
                    : ''
                }`}
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
                      className={`chip ${
                        category ===
                        slug
                          ? 'is-active'
                          : ''
                      }`}
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

          <div className="filter-group">
            <span className="filter-label">
              Availability
            </span>

            <label className="check-line">
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

          <div className="filter-group">
            <span className="filter-label">
              Price
            </span>

            <form
              className="price-row"
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
                className="btn btn-sm"
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
          className="clear-filters"
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
              className="btn btn-quiet btn-sm"
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
          <div className="products-grid">
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
              className="shop-load-more"
              ref={loadMoreRef}
            >
              <button
                type="button"
                className="btn btn-quiet"
                onClick={loadMore}
                disabled={loadingMore}
                aria-label="Load more products"
                aria-busy={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <RiLoader4Line
                      size={17}
                      className="spin"
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