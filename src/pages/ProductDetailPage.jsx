import {
 useCallback,
 useEffect,
 useMemo,
 useRef,
 useState,
} from 'react';
import {
 Link,
 useNavigate,
 useParams,
 useSearchParams,
} from 'react-router-dom';
import {
 RiAddLine,
 RiArrowLeftSLine,
 RiArrowRightSLine,
 RiShoppingBagLine,
 RiShuffleLine,
 RiStarLine,
 RiSubtractLine,
 RiTruckLine,
} from '@remixicon/react';
import { productService } from '../services/products';
import { formatMoney } from '../utils/format';
import {
 absoluteUrl,
 defaultShareImage,
 productDescription,
 productImage,
 setPageSeo,
 siteUrl,
} from '../utils/seo';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ShareButton from '../components/ShareButton';
import {
 ErrorState,
 Spinner,
} from '../components/ui/States';

const LOW_STOCK_THRESHOLD = 10;

const MEASUREMENT_KEYS = new Set([
 'weight',
 'weight_unit',
 'weight_grams',
 'mass',
 'mass_unit',
 'volume',
 'volume_unit',
 'length',
 'width',
 'height',
 'dimension_unit',
 'quantity',
 'quantity_unit',
 'measurement_type',
 'measurement_value',
 'measurement_unit',
]);

function text(value, fallback = '') {
 if (value === null || value === undefined) {
  return fallback;
 }
 
 const result = String(value).trim();
 
 return result || fallback;
}

function finiteNumber(value) {
 const number = Number(value);
 
 return Number.isFinite(number) ? number : null;
}

function normalizeImages(product) {
 const sources = [
  ...(Array.isArray(product?.images) ?
   product.images :
   []),
  product?.image_url,
 ];
 
 const seen = new Set();
 
 return sources
  .map((image) => {
   if (typeof image === 'string') {
    return image.trim();
   }
   
   if (
    image &&
    typeof image === 'object'
   ) {
    return text(
     image.url ||
     image.image_url ||
     image.src,
    );
   }
   
   return '';
  })
  .filter((src) => {
   if (!src || seen.has(src)) {
    return false;
   }
   
   seen.add(src);
   return true;
  });
}

function normalizeStock(value) {
 const stock = finiteNumber(value);
 
 if (stock === null) {
  return null;
 }
 
 return Math.max(0, Math.floor(stock));
}

function normalizeQuantity(value, max) {
 const parsed = Number(value);
 
 if (!Number.isFinite(parsed)) {
  return 1;
 }
 
 const quantity = Math.floor(parsed);
 
 return Math.min(
  Math.max(1, quantity),
  Math.max(1, max),
 );
}

function appendParameter(rows, key, value, prefix = '') {
 if (
  value === null ||
  value === undefined ||
  value === ''
 ) {
  return;
 }
 
 const label = [prefix, key]
  .filter(Boolean)
  .join(' · ')
  .replace(/_/g, ' ');
 
 if (Array.isArray(value)) {
  value.forEach((item, index) => {
   appendParameter(
    rows,
    String(index + 1),
    item,
    label,
   );
  });
  
  return;
 }
 
 if (
  typeof value === 'object' &&
  !Array.isArray(value)
 ) {
  Object.entries(value).forEach(
   ([childKey, childValue]) => {
    appendParameter(
     rows,
     childKey,
     childValue,
     label,
    );
   },
  );
  
  return;
 }
 
 rows.push([
  label,
  String(value),
 ]);
}

export default function ProductDetailPage() {
 const { slug: pathSlug } = useParams();
 const [searchParams] = useSearchParams();
 const navigate = useNavigate();
 
 const { addItem } = useCart();
 const { isAuthenticated } = useAuth();
 const { toast } = useToast();
 
 const slug = text(
  pathSlug || searchParams.get('slug'),
 );
 
 const [product, setProduct] = useState(null);
 const [error, setError] = useState('');
 const [qty, setQty] = useState(1);
 const [activeImg, setActiveImg] = useState(0);
 const [adding, setAdding] = useState(false);
 
 const mountedRef = useRef(false);
 const productRequestRef = useRef(0);
 const addingRef = useRef(false);
 const touchStartRef = useRef(null);
 
 const loadProduct = useCallback(async () => {
  const requestId =
   ++productRequestRef.current;
  
  setProduct(null);
  setError('');
  setQty(1);
  setActiveImg(0);
  
  if (!slug) {
   setError('Product not found.');
   return;
  }
  
  try {
   const data =
    await productService.get(slug);
   
   if (
    !mountedRef.current ||
    requestId !==
    productRequestRef.current
   ) {
    return;
   }
   
   if (!data || typeof data !== 'object') {
    setError(
     'This product is currently unavailable.',
    );
    return;
   }
   
   setProduct(data);
  } catch (err) {
   if (
    !mountedRef.current ||
    requestId !==
    productRequestRef.current
   ) {
    return;
   }
   
   setError(
    err?.message ||
    'Unable to load this product.',
   );
  }
 }, [slug]);
 
 useEffect(() => {
  mountedRef.current = true;
  
  loadProduct();
  
  return () => {
   mountedRef.current = false;
   productRequestRef.current += 1;
   addingRef.current = false;
  };
 }, [loadProduct]);
 
 const images = useMemo(
  () => normalizeImages(product),
  [product],
 );
 
 useEffect(() => {
  if (activeImg >= images.length) {
   setActiveImg(
    Math.max(0, images.length - 1),
   );
  }
 }, [activeImg, images.length]);
 
 useEffect(() => {
  if (!slug) {
   setPageSeo({
    title: 'Product not found — Luviio',
    description: 'The requested product could not be found.',
    path: '/product',
    noindex: true,
   });
   
   return;
  }
  
  const encodedSlug =
   encodeURIComponent(slug);
  
  if (error) {
   setPageSeo({
    title: 'Product unavailable — Luviio',
    description: 'This product is currently unavailable.',
    path: `/product/${encodedSlug}`,
    noindex: true,
   });
   
   return;
  }
  
  if (!product) {
   setPageSeo({
    title: 'Loading product — Luviio',
    description: 'Loading product details.',
    path: `/product/${encodedSlug}`,
    noindex: true,
   });
   
   return;
  }
  
  const name = text(
   product.name,
   'Luviio product',
  );
  
  const description =
   productDescription(product);
  
  const path =
   `/product/${encodedSlug}`;
  
  const url = absoluteUrl(
   path,
   `${siteUrl}/`,
  );
  
  const image = productImage(product);
  
  const price =
   finiteNumber(product.price);
  
  const currency = text(
   product.currency ||
   product.price_currency,
  ).toUpperCase();
  
  const stock =
   normalizeStock(product?.stock);
  
  const hasPrice =
   price !== null &&
   price >= 0 &&
   Boolean(currency);
  
  const productSchema = {
   '@type': 'Product',
   name,
   description,
   url,
   ...(image ?
    { image: [image] } :
    {}),
   ...(product.brand ?
    {
     brand: {
      '@type': 'Brand',
      name: text(product.brand),
     },
    } :
    {}),
   ...(hasPrice ?
    {
     offers: {
      '@type': 'Offer',
      url,
      price,
      priceCurrency: currency,
      ...(stock !== null ?
       {
        availability: stock > 0 ?
         'https://schema.org/InStock' :
         'https://schema.org/OutOfStock',
       } :
       {}),
     },
    } :
    {}),
  };
  
  const breadcrumb = {
   '@type': 'BreadcrumbList',
   itemListElement: [
   {
    '@type': 'ListItem',
    position: 1,
    name: 'Home',
    item: `${siteUrl}/`,
   },
   {
    '@type': 'ListItem',
    position: 2,
    name: 'Shop',
    item: `${siteUrl}/shop`,
   },
   {
    '@type': 'ListItem',
    position: 3,
    name,
    item: url,
   }, ],
  };
  
  setPageSeo({
   title: `${name} — Luviio`,
   description,
   path,
   image: image || defaultShareImage,
   imageAlt: name,
   type: 'product',
   jsonLd: {
    '@context': 'https://schema.org',
    '@graph': [
     breadcrumb,
     productSchema,
    ],
   },
  });
 }, [error, product, slug]);
 
 const moveImage = useCallback(
  (direction) => {
   if (images.length < 2) {
    return;
   }
   
   setActiveImg((current) => {
    const next =
     current +
     direction;
    
    return (
     (next + images.length) %
     images.length
    );
   });
  },
  [images.length],
 );
 
 const onTouchStart = (event) => {
  if (images.length < 2) {
   return;
  }
  
  touchStartRef.current =
   event.changedTouches?.[0]
   ?.clientX ?? null;
 };
 
 const onTouchEnd = (event) => {
  if (
   touchStartRef.current === null
  ) {
   return;
  }
  
  const end =
   event.changedTouches?.[0]
   ?.clientX ??
   touchStartRef.current;
  
  const delta =
   end - touchStartRef.current;
  
  touchStartRef.current = null;
  
  if (Math.abs(delta) > 40) {
   moveImage(
    delta < 0 ? 1 : -1,
   );
  }
 };
 
 const price =
  finiteNumber(product?.price) ?? 0;
 
 const compare =
  finiteNumber(product?.compare_price) ??
  0;
 
 const discount =
  compare > price && compare > 0 ?
  Math.round(
   ((compare - price) /
    compare) *
   100,
  ) :
  0;
 
 const stock =
  normalizeStock(product?.stock);
 
 const hasKnownInventory =
  stock !== null;
 
 const outOfStock =
  product?.is_active === false ||
  (hasKnownInventory && stock <= 0);
 
 const lowStock = !outOfStock &&
  hasKnownInventory &&
  stock <= LOW_STOCK_THRESHOLD;
 
 const maxQuantity =
  Math.max(1, stock ?? 999);
 
 const specifications =
  product?.specifications &&
  typeof product.specifications ===
  'object' &&
  !Array.isArray(product.specifications) ?
  product.specifications :
  {};
 
 const measurement =
  product?.measurement_type &&
  product?.measurement_value != null &&
  product?.measurement_unit ?
  `${product?.measurement_value} ${product?.measurement_unit}` :
  '';
 
 const measurementLabel =
  text(
   product?.measurement_type,
   'measurement',
  ).replace(/_/g, ' ');
 
 const cleanSpecifications =
  Object.fromEntries(
   Object.entries(
    specifications,
   ).filter(
    ([key]) =>
    !MEASUREMENT_KEYS.has(
     String(key).toLowerCase(),
    ),
   ),
  );
 
 const rawAttributes = {
  brand: product?.brand,
  manufacturer: product?.manufacturer,
  model_number: product?.model_number,
  material: product?.material,
  finish: product?.finish,
  color: product?.color,
  size: product?.size,
  ...(measurement ?
   {
    [measurementLabel]: measurement,
   } :
   {}),
  ...cleanSpecifications,
 };
 
 const attributes = [];
 
 Object.entries(
  rawAttributes,
 ).forEach(([key, value]) => {
  appendParameter(
   attributes,
   key,
   value,
  );
 });
 
 const reviewUrl = product?.id ?
  `/reviews?product=${encodeURIComponent(
        String(product?.id),
      )}` :
  '/reviews';
 
 const clampQty = (value) =>
  normalizeQuantity(
   value,
   maxQuantity,
  );
 
 const handleAdd = async (
  buyNow = false,
 ) => {
  if (
   addingRef.current ||
   adding
  ) {
   return;
  }
  
  if (outOfStock) {
   toast.error(
    'This product is currently out of stock.',
   );
   return;
  }
  
  if (!isAuthenticated) {
   toast.info(
    'Please sign in to continue.',
   );
   
   navigate('/login', {
    state: {
     from: `/product/${slug}`,
    },
   });
   
   return;
  }
  
  const quantity = clampQty(qty);
  
  addingRef.current = true;
  setAdding(true);
  
  try {
   await addItem(
    product.id,
    quantity,
   );
   
   if (!mountedRef.current) {
    return;
   }
   
   toast.success(
    `Added ${quantity} to your bag.`,
   );
   
   if (buyNow) {
    navigate('/checkout');
   }
  } catch (err) {
   if (!mountedRef.current) {
    return;
   }
   
   toast.error(
    err?.message ||
    'Unable to add this item.',
   );
  } finally {
   addingRef.current = false;
   
   if (mountedRef.current) {
    setAdding(false);
   }
  }
 };
 
 if (error) {
  return (
   <div className="page container">
    <ErrorState
     message={error}
     onRetry={loadProduct}
    />
   </div>
  );
 }

 if (!product) {
  return (
   <div className="page container">
    <Spinner label="Loading product…" />
   </div>
  );
 }

 return (
  <div className="page container">
      <nav
        className="breadcrumbs"
        aria-label="Breadcrumb"
      >
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <span aria-current="page">
          {product.name}
        </span>
      </nav>

      <div className="product-detail">
        <div className="gallery">
          <div
            className="gallery-main product-image-carousel"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {images[activeImg] ? (
              <img
                src={images[activeImg]}
                alt={`${product.name || 'Product'} image ${
                  activeImg + 1
                }`}
                loading={
                  activeImg === 0
                    ? 'eager'
                    : 'lazy'
                }
                decoding="async"
              />
            ) : (
              <span
                className="placeholder"
                aria-hidden="true"
              >
                {text(
                  product.name,
                  'L',
                ).slice(0, 1)}
              </span>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="product-carousel-arrow product-carousel-prev"
                  onClick={() =>
                    moveImage(-1)
                  }
                  aria-label="Previous product image"
                >
                  <RiArrowLeftSLine
                    size={20}
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  className="product-carousel-arrow product-carousel-next"
                  onClick={() =>
                    moveImage(1)
                  }
                  aria-label="Next product image"
                >
                  <RiArrowRightSLine
                    size={20}
                    aria-hidden="true"
                  />
                </button>

                <span
                  className="product-carousel-count"
                  aria-live="polite"
                >
                  {activeImg + 1} /{' '}
                  {images.length}
                </span>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div
              className="gallery-thumbs"
              role="tablist"
              aria-label="Product images"
            >
              {images.map(
                (src, index) => (
                  <button
                    type="button"
                    key={`${src}-${index}`}
                    className={`thumb ${
                      index === activeImg
                        ? 'is-active'
                        : ''
                    }`}
                    onClick={() =>
                      setActiveImg(index)
                    }
                    aria-label={`View image ${
                      index + 1
                    }`}
                    aria-selected={
                      index === activeImg
                    }
                    role="tab"
                  >
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        <div className="product-info">
          <p className="product-category">
            {text(
              product.categories?.name,
              'Luviio collection',
            )}
          </p>

          <h1>{product.name}</h1>

          {product.short_description && (
            <p className="product-summary">
              {product.short_description}
            </p>
          )}

          <div className="product-price">
            <span className="now">
              {formatMoney(price)}
            </span>

            {compare > price &&
              price > 0 && (
                <span className="was">
                  {formatMoney(compare)}
                </span>
              )}

            {discount > 0 && (
              <span className="save">
                Save {discount}%
              </span>
            )}
          </div>

          <p
            className={`stock-note ${
              outOfStock
                ? 'out'
                : lowStock
                  ? 'low'
                  : 'in'
            }`}
          >
            {outOfStock
              ? 'Out of stock'
              : lowStock
                ? `Only ${stock} left in stock`
                : 'In stock'}
          </p>

          <div className="qty-row">
            <span>Qty</span>

            <div className="qty-stepper">
              <button
                type="button"
                onClick={() =>
                  setQty(
                    clampQty(
                      qty - 1,
                    ),
                  )
                }
                disabled={
                  adding ||
                  outOfStock ||
                  qty <= 1
                }
                aria-label="Decrease quantity"
              >
                <RiSubtractLine
                  size={16}
                  aria-hidden="true"
                />
              </button>

              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={qty}
                onChange={(event) =>
                  setQty(
                    clampQty(
                      event.target.value,
                    ),
                  )
                }
                aria-label="Quantity"
                disabled={
                  adding ||
                  outOfStock
                }
                inputMode="numeric"
              />

              <button
                type="button"
                onClick={() =>
                  setQty(
                    clampQty(
                      qty + 1,
                    ),
                  )
                }
                disabled={
                  adding ||
                  outOfStock ||
                  qty >= maxQuantity
                }
                aria-label="Increase quantity"
              >
                <RiAddLine
                  size={16}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <div className="product-actions">
            <button
              type="button"
              className="btn"
              onClick={() =>
                handleAdd(false)
              }
              disabled={
                outOfStock ||
                adding
              }
              aria-busy={adding}
            >
              <RiShoppingBagLine
                size={16}
                aria-hidden="true"
              />

              {adding
                ? 'Adding…'
                : 'Add to bag'}
            </button>

            <button
              type="button"
              className="btn btn-quiet"
              onClick={() =>
                handleAdd(true)
              }
              disabled={
                outOfStock ||
                adding
              }
              aria-busy={adding}
            >
              <RiShuffleLine
                size={16}
                aria-hidden="true"
              />

              Buy now
            </button>

            <Link
              className="btn btn-quiet"
              to={reviewUrl}
            >
              <RiStarLine
                size={16}
                aria-hidden="true"
              />

              Reviews
            </Link>

            <ShareButton
              title={`${product.name} — Luviio`}
              text={`Check out ${product.name} on Luviio.`}
              url={absoluteUrl(
                `/product/${encodeURIComponent(
                  slug,
                )}`,
                `${siteUrl}/`,
              )}
            />
          </div>

          <p className="shipping-note">
            <RiTruckLine
              size={15}
              aria-hidden="true"
            />

            Free shipping on orders over
            the store threshold.
          </p>

          {attributes.length > 0 && (
            <section
              className="product-parameters"
              aria-labelledby="product-parameters-title"
            >
              <div className="product-parameters-heading">
                <div>
                  <p className="section-kicker">
                    Specifications
                  </p>

                  <h2 id="product-parameters-title">
                    Product parameters
                  </h2>
                </div>

                <span>
                  {attributes.length}{' '}
                  details
                </span>
              </div>

              <dl className="attributes">
                {attributes.map(
                  ([key, value]) => (
                    <div
                      className="attribute-row"
                      key={`${key}-${value}`}
                    >
                      <dt>{key}</dt>
                      <dd>{value}</dd>
                    </div>
                  ),
                )}
              </dl>
            </section>
          )}

          {product.description && (
            <div className="description-block">
              <h3>Details</h3>
              <p>{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
 );
}