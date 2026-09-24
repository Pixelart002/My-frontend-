import { Link, useNavigate } from 'react-router-dom';
import {
  RiArrowLeftSLine,
  RiArrowRightLine,
  RiCheckLine,
  RiShieldCheckLine,
  RiShoppingBag3Line,
  RiFlashlightLine,
  RiHeart3Line,
  RiEyeLine,
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
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(false);

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
  }, [product?.id, product?.slug]);

  if (!product) return null;

  const slug = product.slug || product.id;

  const price = Number(product.price) || 0;
  const compare = Number(product.compare_price) || 0;

  const discount =
    compare > price && compare > 0
      ? Math.round(((compare - price) / compare) * 100)
      : 0;

  const stock = Number(product.stock);

  const outOfStock =
    product.is_active === false ||
    (Number.isFinite(stock) && stock <= 0);

  const lowStock =
    Number.isFinite(stock) &&
    stock > 0 &&
    stock <= 8;

  const name = product.name || 'Product';

  const category =
    product.categories?.name ||
    product.category_name ||
    'Luviio';

  const images = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : [];

  const gallery = useMemo(() => {
    if (images.length) return images;

    return product.image_url
      ? [product.image_url]
      : [];
  }, [product.image_url, product.images]);

  const safeIndex = Math.min(
    activeImage,
    Math.max(0, gallery.length - 1)
  );

  const hasGallery = gallery.length > 1;

  const imageUrl = gallery[safeIndex];

  const priceSaving =
    compare > price && price > 0
      ? compare - price
      : 0;

  const moveImage = (event, direction) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (!hasGallery) return;

    setImageFailed(false);

    setActiveImage(
      (current) =>
        (current + direction + gallery.length) %
        gallery.length
    );
  };

  const selectImage = (event, index) => {
    event.preventDefault();
    event.stopPropagation();

    setImageFailed(false);
    setActiveImage(index);
  };

  const onTouchStart = (event) => {
    if (!hasGallery) return;

    touchStart.current =
      event.changedTouches?.[0]?.clientX ?? null;
  };

  const onTouchEnd = (event) => {
    if (touchStart.current === null) return;

    const end =
      event.changedTouches?.[0]?.clientX ??
      touchStart.current;

    const delta = end - touchStart.current;

    touchStart.current = null;

    if (Math.abs(delta) > 36) {
      moveImage(event, delta < 0 ? 1 : -1);
    }
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      toast.info(
        'Please sign in to add this product to your cart.'
      );

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

      toast.success(
        'Product added to your cart.'
      );

      if (addedTimer.current) {
        window.clearTimeout(addedTimer.current);
      }

      addedTimer.current = window.setTimeout(() => {
        setAdded(false);
      }, 1600);
    } catch (error) {
      toast.error(
        error?.message ||
          'Unable to add this item.'
      );
    } finally {
      setAdding(false);
    }
  };

  const styles = {
    card: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      minWidth: 0,
      overflow: 'hidden',
      background: '#ffffff',
      border: hovered
        ? '1px solid rgba(184, 145, 67, 0.45)'
        : '1px solid rgba(15, 23, 42, 0.08)',
      borderRadius: 22,
      boxShadow: hovered
        ? '0 18px 45px rgba(15, 23, 42, 0.13)'
        : '0 5px 22px rgba(15, 23, 42, 0.06)',
      transform: hovered
        ? 'translateY(-3px)'
        : 'translateY(0)',
      transition:
        'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
    },

    media: {
      position: 'relative',
      width: '100%',
      aspectRatio: '1 / 1',
      overflow: 'hidden',
      background:
        'linear-gradient(145deg, #f8f7f3 0%, #f0eee8 100%)',
      touchAction: 'pan-y',
    },

    mediaLink: {
      display: 'block',
      width: '100%',
      height: '100%',
      textDecoration: 'none',
      outline: 'none',
    },

    image: {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center',
      userSelect: 'none',
      WebkitUserDrag: 'none',
      transition:
        'transform 500ms cubic-bezier(.2,.7,.2,1)',
      transform: hovered
        ? 'scale(1.035)'
        : 'scale(1)',
    },

    placeholder: {
      width: '100%',
      height: '100%',
      display: 'grid',
      placeItems: 'center',
      fontSize: 52,
      fontWeight: 800,
      color: '#b89143',
      background:
        'radial-gradient(circle at 50% 35%, #fff 0%, #eeeae1 100%)',
    },

    badges: {
      position: 'absolute',
      zIndex: 4,
      top: 12,
      left: 12,
      right: 12,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
      pointerEvents: 'none',
    },

    badgeGroup: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      maxWidth: '75%',
    },

    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      minHeight: 27,
      padding: '5px 9px',
      borderRadius: 999,
      fontSize: 11,
      lineHeight: 1,
      fontWeight: 800,
      letterSpacing: '0.02em',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: '0 4px 14px rgba(0,0,0,.08)',
    },

    saleBadge: {
      color: '#fff',
      background:
        'linear-gradient(135deg, #a87929, #c89d4d)',
    },

    stockBadge: {
      color: '#14532d',
      background: 'rgba(240,253,244,.92)',
      border: '1px solid rgba(34,197,94,.15)',
    },

    lowBadge: {
      color: '#92400e',
      background: 'rgba(255,247,237,.94)',
      border: '1px solid rgba(249,115,22,.16)',
    },

    soldBadge: {
      color: '#fff',
      background: 'rgba(15,23,42,.78)',
    },

    iconButton: {
      width: 36,
      height: 36,
      display: 'grid',
      placeItems: 'center',
      border: '1px solid rgba(15,23,42,.08)',
      borderRadius: '50%',
      background: 'rgba(255,255,255,.9)',
      color: '#111827',
      cursor: 'pointer',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: '0 5px 18px rgba(0,0,0,.08)',
      transition:
        'transform 180ms ease, background 180ms ease, color 180ms ease',
      pointerEvents: 'auto',
    },

    navigationButton: {
      position: 'absolute',
      zIndex: 5,
      top: '50%',
      width: 34,
      height: 34,
      display: 'grid',
      placeItems: 'center',
      border: '1px solid rgba(255,255,255,.65)',
      borderRadius: '50%',
      background: 'rgba(255,255,255,.88)',
      color: '#111827',
      cursor: 'pointer',
      boxShadow: '0 5px 18px rgba(0,0,0,.12)',
      transform: 'translateY(-50%)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    },

    leftNavigation: {
      left: 10,
    },

    rightNavigation: {
      right: 10,
    },

    count: {
      position: 'absolute',
      zIndex: 5,
      right: 12,
      bottom: 12,
      padding: '5px 8px',
      borderRadius: 999,
      color: '#fff',
      background: 'rgba(15,23,42,.68)',
      fontSize: 10,
      fontWeight: 800,
      lineHeight: 1,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    },

    dots: {
      position: 'absolute',
      zIndex: 5,
      left: '50%',
      bottom: 13,
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 7px',
      borderRadius: 999,
      background: 'rgba(255,255,255,.78)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      transform: 'translateX(-50%)',
    },

    dot: {
      width: 5,
      height: 5,
      padding: 0,
      border: 0,
      borderRadius: 999,
      background: 'rgba(15,23,42,.28)',
      cursor: 'pointer',
      transition:
        'width 180ms ease, background 180ms ease',
    },

    activeDot: {
      width: 17,
      background: '#b89143',
    },

    body: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      padding: '15px 15px 12px',
      minWidth: 0,
    },

    category: {
      margin: 0,
      color: '#9a7a3d',
      fontSize: 10,
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },

    title: {
      display: '-webkit-box',
      margin: '5px 0 0',
      overflow: 'hidden',
      color: '#111827',
      fontSize: 15,
      fontWeight: 750,
      lineHeight: 1.35,
      letterSpacing: '-0.015em',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
    },

    priceRow: {
      display: 'flex',
      alignItems: 'baseline',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 3,
    },

    price: {
      color: '#0f172a',
      fontSize: 19,
      fontWeight: 850,
      lineHeight: 1,
      letterSpacing: '-0.025em',
    },

    compare: {
      color: '#94a3b8',
      fontSize: 12,
      fontWeight: 600,
      textDecoration: 'line-through',
    },

    saving: {
      color: '#15803d',
      fontSize: 10,
      fontWeight: 800,
    },

    footer: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      padding: '0 15px 15px',
    },

    cta: {
      flex: 1,
      minHeight: 43,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      padding: '0 14px',
      border: 0,
      borderRadius: 13,
      color: '#fff',
      background:
        'linear-gradient(135deg, #151515 0%, #292929 100%)',
      fontSize: 12,
      fontWeight: 800,
      cursor: 'pointer',
      boxShadow:
        '0 8px 18px rgba(15,15,15,.14)',
      transition:
        'transform 180ms ease, opacity 180ms ease, background 180ms ease',
    },

    addedCta: {
      background:
        'linear-gradient(135deg, #166534 0%, #15803d 100%)',
    },

    unavailableCta: {
      color: '#64748b',
      background: '#f1f5f9',
      boxShadow: 'none',
      cursor: 'not-allowed',
    },

    quickView: {
      width: 43,
      height: 43,
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0,
      border: '1px solid rgba(15,23,42,.1)',
      borderRadius: 13,
      background: '#fff',
      color: '#334155',
      cursor: 'pointer',
      transition:
        'background 180ms ease, border-color 180ms ease',
    },
  };

  return (
    <article
      aria-label={name}
      style={styles.card}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* IMAGE */}
      <div
        style={styles.media}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* TOP BADGES */}
        <div style={styles.badges}>
          <div style={styles.badgeGroup}>
            {discount > 0 && (
              <span
                style={{
                  ...styles.badge,
                  ...styles.saleBadge,
                }}
              >
                <RiFlashlightLine size={12} />
                {discount}% OFF
              </span>
            )}

            {!outOfStock ? (
              <span
                style={{
                  ...styles.badge,
                  ...(lowStock
                    ? styles.lowBadge
                    : styles.stockBadge),
                }}
              >
                <RiShieldCheckLine size={12} />
                {lowStock
                  ? `Only ${stock} left`
                  : 'In stock'}
              </span>
            ) : (
              <span
                style={{
                  ...styles.badge,
                  ...styles.soldBadge,
                }}
              >
                Sold out
              </span>
            )}
          </div>

          {/* WISHLIST */}
          <button
            type="button"
            aria-label={
              liked
                ? `Remove ${name} from wishlist`
                : `Add ${name} to wishlist`
            }
            aria-pressed={liked}
            style={{
              ...styles.iconButton,
              color: liked ? '#b91c1c' : '#111827',
              background: liked
                ? 'rgba(254,242,242,.95)'
                : 'rgba(255,255,255,.9)',
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setLiked((value) => !value);
            }}
          >
            <RiHeart3Line
              size={18}
              fill={liked ? 'currentColor' : 'none'}
            />
          </button>
        </div>

        {/* PRODUCT IMAGE */}
        <Link
          to={`/product/${slug}`}
          style={styles.mediaLink}
          aria-label={`View ${name}`}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              moveImage(event, -1);
            }

            if (event.key === 'ArrowRight') {
              moveImage(event, 1);
            }
          }}
        >
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={`${name} image ${safeIndex + 1}`}
              loading="lazy"
              decoding="async"
              draggable="false"
              style={styles.image}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span
              style={styles.placeholder}
              aria-hidden="true"
            >
              {name.trim().slice(0, 1).toUpperCase() || 'L'}
            </span>
          )}
        </Link>

        {/* IMAGE NAVIGATION */}
        {hasGallery && (
          <>
            <button
              type="button"
              aria-label="Previous product image"
              style={{
                ...styles.navigationButton,
                ...styles.leftNavigation,
              }}
              onClick={(event) =>
                moveImage(event, -1)
              }
            >
              <RiArrowLeftSLine size={18} />
            </button>

            <button
              type="button"
              aria-label="Next product image"
              style={{
                ...styles.navigationButton,
                ...styles.rightNavigation,
              }}
              onClick={(event) =>
                moveImage(event, 1)
              }
            >
              <RiArrowRightLine size={18} />
            </button>

            <span
              style={styles.count}
              aria-live="polite"
            >
              {safeIndex + 1}/{gallery.length}
            </span>

            <div
              style={styles.dots}
              aria-label="Select product image"
            >
              {gallery.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`View image ${index + 1}`}
                  aria-current={
                    index === safeIndex
                      ? 'true'
                      : undefined
                  }
                  onClick={(event) =>
                    selectImage(event, index)
                  }
                  style={{
                    ...styles.dot,
                    ...(index === safeIndex
                      ? styles.activeDot
                      : {}),
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* PRODUCT INFORMATION */}
      <div style={styles.body}>
        <div>
          <p style={styles.category}>
            {category}
          </p>

          <h3
            title={name}
            style={styles.title}
          >
            {name}
          </h3>
        </div>

        <div
          style={styles.priceRow}
          aria-label={`Price ${formatMoney(price)}`}
        >
          <span style={styles.price}>
            {formatMoney(price)}
          </span>

          {compare > price && price > 0 && (
            <>
              <span
                style={styles.compare}
                aria-label={`Previous price ${formatMoney(
                  compare
                )}`}
              >
                {formatMoney(compare)}
              </span>

              {priceSaving > 0 && (
                <span style={styles.saving}>
                  Save {formatMoney(priceSaving)}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      <div style={styles.footer}>
        <Link
          to={`/product/${slug}`}
          aria-label={`View details for ${name}`}
          style={{
            ...styles.quickView,
            textDecoration: 'none',
          }}
        >
          <RiEyeLine size={18} />
        </Link>

        <button
          type="button"
          onClick={handleAdd}
          aria-label={
            outOfStock
              ? `${name} is currently unavailable`
              : added
                ? `${name} added to cart`
                : `Add ${name} to cart`
          }
          disabled={outOfStock || adding}
          aria-busy={adding}
          style={{
            ...styles.cta,
            ...(added ? styles.addedCta : {}),
            ...(outOfStock
              ? styles.unavailableCta
              : {}),
          }}
        >
          {outOfStock ? (
            <>
              <span>Unavailable</span>
            </>
          ) : adding ? (
            <>
              <span>Adding…</span>
            </>
          ) : added ? (
            <>
              <RiCheckLine size={16} />
              <span>Added to cart</span>
            </>
          ) : (
            <>
              <RiShoppingBag3Line size={16} />
              <span>Add to cart</span>
              <RiArrowRightLine size={15} />
            </>
          )}
        </button>
      </div>
    </article>
  );
}