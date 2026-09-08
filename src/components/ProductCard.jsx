import { Link, useNavigate } from 'react-router-dom';
import { RiArrowRightLine, RiCheckLine } from '@remixicon/react';
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
  const [imageFailed, setImageFailed] = useState(false);
  const addedTimer = useRef(null);

  useEffect(() => () => {
    if (addedTimer.current) window.clearTimeout(addedTimer.current);
  }, []);

  if (!product) return null;

  const slug = product.slug || product.id;
  const price = Number(product.price) || 0;
  const compare = Number(product.compare_price) || 0;
  const discount = Number(product.discount_percentage) || 0;
  const stock = Number(product.stock);
  const outOfStock = product.is_active === false || (Number.isFinite(stock) && stock <= 0);
  const name = product.name || 'Product';
  const category = product.categories?.name || product.category_name || 'Luviio collection';

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your bag.');
      navigate('/login', { state: { from: `/product/${slug}` } });
      return;
    }
    if (outOfStock || adding) return;
    setAdding(true);
    try {
      await addItem(product.id, 1);
      setAdded(true);
      toast.success('Added to your bag.');
      if (addedTimer.current) window.clearTimeout(addedTimer.current);
      addedTimer.current = window.setTimeout(() => setAdded(false), 1600);
    } catch (err) {
      toast.error(err?.message || 'Unable to add this item.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="product-card">
      {discount > 0 && <span className="badge">Save {Math.round(discount)}%</span>}
      <Link to={`/product/${slug}`} className="product-media" aria-label={`View ${name}`}>
        {product.image_url && !imageFailed ? (
          <img src={product.image_url} alt={name} loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
        ) : (
          <span className="placeholder" aria-hidden="true">{name.trim().slice(0, 1).toUpperCase() || 'L'}</span>
        )}
      </Link>

      <div className="product-meta">
        <div>
          <p className="product-category">{category}</p>
          <h3 title={name}>{name}</h3>
        </div>
        <div className="product-price-row" aria-label={`Price ${formatMoney(price)}`}>
          {compare > price && price > 0 && <span className="was">{formatMoney(compare)}</span>}
          <span>{formatMoney(price)}</span>
        </div>
      </div>

      <button
        type="button"
        className={`add-button ${added ? 'done' : ''}`}
        onClick={handleAdd}
        disabled={outOfStock || adding}
        aria-busy={adding}
      >
        <span>{outOfStock ? 'Out of stock' : adding ? 'Adding…' : added ? 'Added to bag' : 'Add to bag'}</span>
        {!outOfStock && (added ? <RiCheckLine size={15} /> : <RiArrowRightLine size={15} />)}
      </button>
    </article>
  );
}
