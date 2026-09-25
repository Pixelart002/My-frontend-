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
    <article
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-luviio-card transition-all duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--gold)_28%,var(--line))]"
      aria-label={name}
    >
      <div
        className="product-media relative aspect-square overflow-hidden rounded-t-2xl border-0 bg-[#f2f0eb] shadow-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Link
          to={`/product/${slug}`}
          className="product-media-link absolute inset-0 z-[1] block overflow-hidden"
          aria-label={`View ${name}`}
          onKeyDown={handleMediaKeyDown}
        >
          {currentImage && !imageFailed ? (
            <img
              className="product-image block h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025] group-focus-within:scale-[1.01] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              src={currentImage}
              alt={name}
              loading="lazy"
              decoding="async"
              draggable="false"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-[#211e1a] font-display text-5xl text-gold">
              {name.trim().slice(0, 1).toUpperCase() || 'L'}
            </span>
          )}

          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent"
            aria-hidden="true"
          />
        </Link>

        {discount > 0 && (
          <span className="absolute left-3 top-3 z-10 inline-flex min-h-7 items-center rounded-full border border-gold/30 bg-[#11100f]/85 px-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-gold-soft shadow-lg backdrop-blur-md">
            Save {discount}%
          </span>
        )}

        {imageCount > 1 && (
          <>
            <button
              type="button"
              className="product-carousel-arrow left-2.5 top-1/2 border-white/20 bg-black/45 text-white shadow-lg backdrop-blur-md"
              onClick={(event) => moveImage(event, -1)}
              aria-label="Previous product image"
            >
              <RiArrowLeftSLine size={18} />
            </button>

            <button
              type="button"
              className="product-carousel-arrow right-2.5 top-1/2 border-white/20 bg-black/45 text-white shadow-lg backdrop-blur-md"
              onClick={(event) => moveImage(event, 1)}
              aria-label="Next product image"
            >
              <RiArrowRightLine size={18} />
            </button>

            <span
              className="product-carousel-count rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[9px] font-medium text-white backdrop-blur-md"
              aria-live="polite"
            >
              {safeIndex + 1}
              <span aria-hidden="true"> / </span>
              {imageCount}
            </span>

            <div
              className="product-carousel-dots rounded-full border border-white/10 bg-black/45 px-1.5 py-0.5 backdrop-blur-md"
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

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="min-w-0">
          <p className="m-0 mb-1.5 truncate text-[9px] font-bold uppercase tracking-[0.11em] text-muted">
            {category}
          </p>

          <h3 className="m-0 line-clamp-2 min-h-[2.7rem] text-[13px] font-semibold leading-[1.4] tracking-[-0.005em] text-text sm:text-[14px]">
            <Link
              to={`/product/${slug}`}
              className="rounded-sm text-inherit no-underline transition-colors hover:text-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {name}
            </Link>
          </h3>
        </div>

        <div className="mt-3 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[15px] font-bold tabular-nums tracking-[-0.01em] text-text sm:text-base">
            {formatMoney(price)}
          </span>

          {comparePrice > price && price > 0 && (
            <span className="text-[10px] font-medium tabular-nums text-dim line-through sm:text-[11px]">
              {formatMoney(comparePrice)}
            </span>
          )}

          {discount > 0 && (
            <span className="rounded bg-success-dim px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-success">
              {discount}% off
            </span>
          )}
        </div>

        <p
          className={`m-0 mt-1 min-h-4 text-[9px] leading-4 text-muted${savings > 0 ? '' : ' opacity-0'}`}
          aria-hidden={savings <= 0}
        >
          You save {formatMoney(savings)}
        </p>

        <button
          type="button"
          className={`mt-3 flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-[10px] font-bold transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50 ${
            added
              ? 'border-success/40 bg-success-dim text-success'
              : 'border-line bg-surface-2 text-text hover:border-gold/55 hover:bg-gold-dim hover:text-gold-soft'
          }`}
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
          <span className="min-w-0 truncate">
            {outOfStock
              ? 'Out of stock'
              : adding
                ? 'Adding…'
                : added
                  ? 'Added to bag'
                  : 'Add to bag'}
          </span>

          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${
              added
                ? 'border-success/35 bg-success/10 text-success'
                : 'border-line bg-black/15 text-gold'
            }`}
            aria-hidden="true"
          >
            {added ? (
              <RiCheckLine size={16} />
            ) : (
              <RiShoppingBag3Line size={16} />
            )}
          </span>
        </button>
      </div>
    </article>
  );
}
