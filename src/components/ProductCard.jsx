import { Link, useNavigate } from 'react-router-dom';
import {
  RiArrowLeftSLine,
  RiArrowRightLine,
  RiCheckLine,
  RiShoppingBag3Line,
} from '@remixicon/react';
import { useEffect, useMemo, useRef, useState } from 'react';

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

  useEffect(() => {
    return () => {
      if (addedTimer.current) {
        window.clearTimeout(addedTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    setActiveImage(0);
    setImageFailed(false);
  }, [product?.id]);

  if (!product) return null;

  const slug = product.slug || product.id;
  const name = product.name || 'Product';
  const category =
    product.categories?.name ||
    product.category_name ||
    'Luviio collection';

  const price = Number(product.price) || 0;
  const comparePrice = Number(product.compare_price) || 0;
  const stock = Number(product.stock);

  const discount =
    comparePrice > price && comparePrice > 0
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : 0;

  const outOfStock =
    product.is_active === false ||
    (Number.isFinite(stock) && stock <= 0);

  const gallery = useMemo(() => {
    const images = Array.isArray(product.images)
      ? product.images.filter(Boolean)
      : [];

    return images.length > 0
      ? images
      : product.image_url
        ? [product.image_url]
        : [];
  }, [product.images, product.image_url]);

  const imageCount = gallery.length;
  const safeIndex =
    imageCount > 0
      ? Math.min(activeImage, imageCount - 1)
      : 0;

  const currentImage = gallery[safeIndex];
  const savings = Math.max(comparePrice - price, 0);

  const moveImage = (event, direction) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (imageCount < 2) return;

    setImageFailed(false);
    setActiveImage(
      (current) => (current + direction + imageCount) % imageCount,
    );
  };

  const selectImage = (event, index) => {
    event.preventDefault();
    event.stopPropagation();

    setImageFailed(false);
    setActiveImage(index);
  };

  const handleMediaKeyDown = (event) => {
    if (imageCount < 2) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveImage(event, -1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveImage(event, 1);
    }
  };

  const handleTouchStart = (event) => {
    if (imageCount < 2) return;

    touchStart.current =
      event.changedTouches?.[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    if (touchStart.current === null) return;

    const end =
      event.changedTouches?.[0]?.clientX ??
      touchStart.current;

    const delta = end - touchStart.current;
    touchStart.current = null;

    if (Math.abs(delta) <= 36) return;

    moveImage(event, delta < 0 ? 1 : -1);
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your bag.');

      navigate('/login', {
        state: {
          from: `/product/${slug}`,
        },
      });

      return;
    }

    if (outOfStock || adding) return;

    setAdding(true);

    try {
      await addItem(product.id, 1);

      setAdded(true);
      toast.success('Added to your bag.');

      if (addedTimer.current) {
        window.clearTimeout(addedTimer.current);
      }

      addedTimer.current = window.setTimeout(() => {
        setAdded(false);
      }, 1600);
    } catch (error) {
      toast.error(
        error?.message || 'Unable to add this item.',
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="product-card" aria-label={name}>
      <div
        className="product-media"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Link
          to={`/product/${slug}`}
          className="product-media-link"
          aria-label={`View ${name}`}
          onKeyDown={handleMediaKeyDown}
        >
          {currentImage && !imageFailed ? (
            <img
              className="product-image"
              src={currentImage}
              alt={name}
              loading="lazy"
              decoding="async"
              draggable="false"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="product-image-placeholder" aria-hidden="true">
              {name.trim().slice(0, 1).toUpperCase() || 'L'}
            </span>
          )}

          <span className="product-image-shade" aria-hidden="true" />
        </Link>

        {discount > 0 && (
          <span className="product-discount-badge">
            Save {discount}%
          </span>
        )}

        {imageCount > 1 && (
          <>
            <button
              type="button"
              className="product-carousel-arrow product-carousel-prev"
              onClick={(event) => moveImage(event, -1)}
              aria-label="Previous product image"
            >
              <RiArrowLeftSLine size={18} />
            </button>

            <button
              type="button"
              className="product-carousel-arrow product-carousel-next"
              onClick={(event) => moveImage(event, 1)}
              aria-label="Next product image"
            >
              <RiArrowRightLine size={18} />
            </button>

            <span className="product-carousel-count" aria-live="polite">
              {safeIndex + 1}
              <span aria-hidden="true"> / </span>
              {imageCount}
            </span>

            <div
              className="product-carousel-dots"
              aria-label="Product image navigation"
            >
              {gallery.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={index === safeIndex ? 'is-active' : ''}
                  onClick={(event) => selectImage(event, index)}
                  aria-label={`View image ${index + 1}`}
                  aria-current={
                    index === safeIndex ? 'true' : undefined
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="product-card-content">
        <div className="product-copy">
          <p className="product-category">{category}</p>

          <h3 className="product-title">
            <Link to={`/product/${slug}`}>{name}</Link>
          </h3>
        </div>

        <div className="product-pricing" aria-label="Product price">
          <span className="product-price">
            {formatMoney(price)}
          </span>

          {comparePrice > price && price > 0 && (
            <span className="product-was">
              {formatMoney(comparePrice)}
            </span>
          )}

          {discount > 0 && (
            <span className="product-off">{discount}% off</span>
          )}
        </div>

        {savings > 0 && (
          <p className="product-saving">
            You save {formatMoney(savings)}
          </p>
        )}

        <button
          type="button"
          className={`product-add-button${added ? ' is-added' : ''}${outOfStock ? ' is-disabled' : ''}`}
          onClick={handleAdd}
          disabled={outOfStock || adding}
          aria-busy={adding}
          aria-label={
            outOfStock
              ? `${name} is out of stock`
              : added
                ? `${name} added to bag`
                : `Add ${name} to bag`
          }
        >
          <span className="product-add-label">
            {outOfStock
              ? 'Out of stock'
              : adding
                ? 'Adding…'
                : added
                  ? 'Added to bag'
                  : 'Add to bag'}
          </span>

          <span className="product-add-icon" aria-hidden="true">
            {added ? (
              <RiCheckLine size={17} />
            ) : (
              <RiShoppingBag3Line size={17} />
            )}
          </span>
        </button>
      </div>
    </article>
  );
}
