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
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-luviio-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_22px_52px_rgba(0,0,0,.26)] motion-reduce:transform-none"
      aria-label={name}
    >
      <div
        className="relative aspect-[4/3] overflow-hidden bg-surface-2 p-3 sm:p-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Link
          to={`/product/${slug}`}
          className="absolute inset-3 z-[1] block overflow-hidden rounded-xl border border-line/70 bg-[#111111] sm:inset-4"
          aria-label={`View ${name}`}
          onKeyDown={handleMediaKeyDown}
        >
          {currentImage && !imageFailed ? (
            <img
              className="product-image block h-full w-full object-contain p-3 transition-transform duration-300 ease-out group-hover:scale-[1.025] group-focus-within:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:p-5"
              src={currentImage}
              alt={name}
              loading="lazy"
              decoding="async"
              draggable="false"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-surface-2 font-display text-5xl text-gold">
              {name.trim().slice(0, 1).toUpperCase() || 'L'}
            </span>
          )}

          <span
            className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.035]"
            aria-hidden="true"
          />
        </Link>

        {discount > 0 && (
          <span className="absolute left-3 top-3 z-10 inline-flex min-h-7 items-center rounded-full border border-gold/30 bg-black/75 px-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-gold-soft shadow-lg backdrop-blur-md">
            Save {discount}%
          </span>
        )}

        {imageCount > 1 && (
          <>
            <button
              type="button"
              className="absolute left-2.5 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/45 text-white opacity-0 shadow-lg backdrop-blur-md transition-all duration-150 hover:scale-105 hover:bg-black/70 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold group-hover:opacity-100 motion-reduce:transition-none max-[760px]:opacity-100"
              onClick={(event) => moveImage(event, -1)}
              aria-label="Previous product image"
            >
              <RiArrowLeftSLine size={18} />
            </button>

            <button
              type="button"
              className="absolute right-2.5 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/45 text-white opacity-0 shadow-lg backdrop-blur-md transition-all duration-150 hover:scale-105 hover:bg-black/70 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold group-hover:opacity-100 motion-reduce:transition-none max-[760px]:opacity-100"
              onClick={(event) => moveImage(event, 1)}
              aria-label="Next product image"
            >
              <RiArrowRightLine size={18} />
            </button>

            <span
              className="absolute right-3 top-3 z-10 rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[9px] font-medium tabular-nums text-white backdrop-blur-md"
              aria-live="polite"
            >
              {safeIndex + 1}
              <span aria-hidden="true"> / </span>
              {imageCount}
            </span>

            <div
              className="absolute bottom-2 left-1/2 z-10 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-0.5 rounded-full border border-white/10 bg-black/45 px-1.5 py-0.5 backdrop-blur-md"
              aria-label="Product image navigation"
            >
              {gallery.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`relative h-7 w-7 shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold before:absolute before:left-1/2 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-white/60 before:transition-all before:duration-150 ${index === safeIndex ? "before:w-4 before:rounded-full before:bg-white" : ""}`}
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

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="min-w-0">
          <h3 className="m-0 h-[2.6rem] max-h-[2.6rem] overflow-hidden text-[13px] font-semibold leading-[1.3] tracking-[-0.005em] text-text break-words sm:text-[14px]">
            <Link
              to={`/product/${slug}`}
              className="rounded-sm text-inherit no-underline transition-colors hover:text-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {name}
            </Link>
          </h3>
        </div>

        <div className="mt-2 flex h-[3.25rem] min-h-[3.25rem] min-w-0 shrink-0 items-end justify-between gap-3 overflow-hidden">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-[15px] font-bold tabular-nums tracking-[-0.01em] text-gold-soft sm:text-base">
                {formatMoney(price)}
              </span>

              {comparePrice > price && price > 0 && (
                <span className="text-[10px] font-medium tabular-nums text-dim line-through sm:text-[11px]">
                  {formatMoney(comparePrice)}
                </span>
              )}
            </div>

            <p
              className={`m-0 mt-0.5 min-h-4 text-[9px] leading-4 text-muted${savings > 0 ? '' : ' opacity-0'}`}
              aria-hidden={savings <= 0}
            >
              You save {formatMoney(savings)}
            </p>
          </div>

          {discount > 0 && (
            <span className="shrink-0 rounded-full border border-success/20 bg-success-dim px-2 py-1 text-[8px] font-bold uppercase tracking-[0.06em] text-success">
              {discount}% off
            </span>
          )}
        </div>

        <button
          type="button"
          className={`mt-auto flex h-11 min-h-11 w-full min-w-0 shrink-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold transition-[background-color,border-color,color,transform] duration-150 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50 ${
            added
              ? 'border-[rgba(111,191,138,.45)] bg-success-dim text-success'
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
                ? 'border-[rgba(111,191,138,.35)] bg-[rgba(111,191,138,.10)] text-success'
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
