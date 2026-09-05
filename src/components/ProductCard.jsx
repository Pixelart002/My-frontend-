import { Link, useNavigate } from 'react-router-dom';
import { RiArrowRightLine, RiCheckLine } from '@remixicon/react';
import { useState } from 'react';
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

  const price = product.price ?? 0;
  const compare = product.compare_price ?? 0;
  const discount = product.discount_percentage ?? 0;
  const outOfStock = product.is_active === false || (Number(product.stock) <= 0);

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your bag.');
      navigate('/login', { state: { from: `/product/${product.slug}` } });
      return;
    }
    if (outOfStock) return;
    if (adding) return;
    setAdding(true);
    try {
      await addItem(product.id, 1);
      setAdded(true);
      toast.success('Added to your bag.');
      setTimeout(() => setAdded(false), 1600);
    } catch (err) {
      toast.error(err.message || 'Unable to add this item.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="product-card">
      {discount > 0 && <span className="badge">Save {Math.round(discount)}%</span>}
      <Link to={`/product/${product.slug || product.id}`} className="product-media">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name || 'Product'} loading="lazy" />
        ) : (
          <span className="placeholder">{(product.name || 'L').slice(0, 1)}</span>
        )}
      </Link>

      <div className="product-meta">
        <div>
          <p className="product-category">{product.categories?.name || product.category_name || 'Luviio collection'}</p>
          <h3>{product.name}</h3>
        </div>
        <div className="product-price-row">
          {compare > price && price > 0 && <span className="was">{formatMoney(compare)}</span>}
          <span>{formatMoney(price)}</span>
        </div>
      </div>

      <button
        className={`add-button ${added ? 'done' : ''}`}
        onClick={handleAdd}
        disabled={outOfStock || adding}
      >
        {outOfStock ? 'Out of stock' : added ? 'Added to bag' : 'Add to bag'}
        {!outOfStock && (added ? <RiCheckLine size={15} /> : <RiArrowRightLine size={15} />)}
      </button>
    </article>
  );
}
