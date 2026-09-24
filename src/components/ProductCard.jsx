import { Link, useNavigate } from 'react-router-dom';
import { RiArrowLeftSLine, RiArrowRightLine, RiCheckLine, RiShieldCheckLine } from '@remixicon/react';
import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '../utils/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const addedTimer = useRef(null);
  const touchStart = useRef(null);

  useEffect(() => () => {
    if (addedTimer.current) window.clearTimeout(addedTimer.current);
  }, []);

  useEffect(() => {
    setActiveImage(0);
    setImageFailed(false);
  }, [product?.id, product?.slug]);

  if (!product) return null;

  const slug = product.slug || product.id;
  const price = Number(product.price) || 0;
  const compare = Number(product.compare_price) || 0;
  const discount = compare > price && compare > 0 ? Math.round(((compare - price) / compare) * 100) : 0;
  const stock = Number(product.stock);
  const outOfStock = product.is_active === false || (Number.isFinite(stock) && stock <= 0);
  const lowStock = Number.isFinite(stock) && stock > 0 && stock <= 8;
  const name = product.name || 'Product';
  const category = product.categories?.name || product.category_name || 'Luviio';
  const images = (Array.isArray(product.images) ? product.images : []).filter(Boolean);
  const gallery = images.length ? images : product.image_url ? [product.image_url] : [];
  const safeIndex = Math.min(activeImage, Math.max(0, gallery.length - 1));

  const moveImage = (event, direction) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (gallery.length < 2) return;
    setImageFailed(false);
    setActiveImage((current) => (current + direction + gallery.length) % gallery.length);
  };

  const selectImage = (event, index) => {
    event.preventDefault();
    event.stopPropagation();
    setImageFailed(false);
    setActiveImage(index);
  };

  const onTouchStart = (event) => {
    if (gallery.length < 2) return;
    touchStart.current = event.changedTouches?.[0]?.clientX ?? null;
  };

  const onTouchEnd = (event) => {
    if (touchStart.current === null) return;
    const end = event.changedTouches?.[0]?.clientX ?? touchStart.current;
    const delta = end - touchStart.current;
    touchStart.current = null;
    if (Math.abs(delta) > 36) moveImage(event, delta < 0 ? 1 : -1);
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Please sign in to add this product to your cart.');
      navigate('/login', { state: { from: `/product/${slug}` } });
      return;
    }

    if (outOfStock || adding) return;

    setAdding(true);
    try {
      await addItem(product.id, 1);
      setAdded(true);
      toast.success('Product added to your cart.');
      if (addedTimer.current) window.clearTimeout(addedTimer.current);
      addedTimer.current = window.setTimeout(() => setAdded(false), 1600);
    } catch (error) {
      toast.error(error?.message || 'Unable to add this item.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="product-card" aria-label={name}>
      <div className="product-card__media-wrap" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="product-card__badges">
          {discount > 0 && <span className="product-badge product-badge--sale">-{discount}%</span>}
          {!outOfStock ? (
            <span className={`product-badge ${lowStock ? 'product-badge--low' : 'product-badge--stock'}`}>
              <RiShieldCheckLine size={12} />
              {lowStock ? 'Low stock' : 'In stock'}
            </span>
          ) : (
            <span className="product-badge product-badge--soldout">Sold out</span>
          )}
        </div>

        <Link to={`/product/${slug}`} className="product-card__media-link" aria-label={`View ${name}`} onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') moveImage(event, -1);
          if (event.key === 'ArrowRight') moveImage(event, 1);
        }}>
          {gallery[safeIndex] && !imageFailed ? (
            <img
              src={gallery[safeIndex]}
              alt={`${name} image ${safeIndex + 1}`}
              loading="lazy"
              decoding="async"
              draggable="false"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="product-card__placeholder" aria-hidden="true">
              {name.trim().slice(0, 1).toUpperCase() || 'L'}
            </span>
          )}
        </Link>

        {gallery.length > 1 && (
          <>
            <button type="button" className="product-card__arrow product-card__arrow--prev" onClick={(event) => moveImage(event, -1)} aria-label="Previous product image">
              <RiArrowLeftSLine size={18} />
            </button>
            <button type="button" className="product-card__arrow product-card__arrow--next" onClick={(event) => moveImage(event, 1)} aria-label="Next product image">
              <RiArrowRightLine size={18} />
            </button>
            <span className="product-card__count" aria-live="polite">{safeIndex + 1}/{gallery.length}</span>
            <div className="product-card__dots" aria-label="Select product image">
              {gallery.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={index === safeIndex ? 'is-active' : ''}
                  onClick={(event) => selectImage(event, index)}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="product-card__body">
        <div className="product-card__copy">
          <p className="product-card__category">{category}</p>
          <h3 title={name}>{name}</h3>
        </div>

        <div className="product-card__price-row" aria-label={`Price ${formatMoney(price)}`}>
          <span className="product-card__price">{formatMoney(price)}</span>
          {compare > price && price > 0 && (
            <span className="product-card__compare" aria-label={`Previous price ${formatMoney(compare)}`}>
              {formatMoney(compare)}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        className={`product-card__cta ${added ? 'is-added' : ''}`}
        onClick={handleAdd}
        aria-label={outOfStock ? `${name} is currently unavailable` : added ? `${name} added to cart` : `Add ${name} to cart`}
        disabled={outOfStock || adding}
        aria-busy={adding}
      >
        <span>{outOfStock ? 'Unavailable' : adding ? 'Adding…' : added ? 'Added' : 'Add to cart'}</span>
        {!outOfStock && (added ? <RiCheckLine size={15} /> : <RiArrowRightLine size={15} />)}
      </button>
    </article>
  );
}
