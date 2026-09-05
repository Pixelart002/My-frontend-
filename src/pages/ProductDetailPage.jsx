import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RiSubtractLine, RiAddLine, RiShoppingBagLine, RiShuffleLine, RiTruckLine } from '@remixicon/react';
import { productService } from '../services/products';
import { formatMoney } from '../utils/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner, ErrorState } from '../components/ui/States';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    setProduct(null);
    setError('');
    setQty(1);
    setActiveImg(0);
    productService
      .get(slug)
      .then((data) => active && setProduct(data))
      .catch((err) => active && setError(err.message || 'Unable to load this product.'));
    return () => {
      active = false;
    };
  }, [slug]);

  if (error) return <div className="page container"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>;
  if (!product) return <div className="page container"><Spinner label="Loading product…" /></div>;

  const images = Array.isArray(product.images) && product.images.length
    ? product.images
    : [product.image_url].filter(Boolean);

  const price = Number(product.price) || 0;
  const compare = Number(product.compare_price) || 0;
  const discount = Number(product.discount_percentage) || 0;
  const stock = Number(product.stock) ?? 0;
  const outOfStock = product.is_active === false || stock <= 0;
  const lowStock = !outOfStock && product.low_stock_threshold != null && stock <= Number(product.low_stock_threshold);

  const attributes = product.attributes && typeof product.attributes === 'object' ? product.attributes : {};

  const clampQty = (v) => Math.min(Math.max(1, Number(v) || 1), Math.max(1, stock || 999));

  const handleAdd = async (buyNow) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to continue.');
      navigate('/login', { state: { from: `/product/${slug}` } });
      return;
    }
    setAdding(true);
    try {
      await addItem(product.id, qty);
      toast.success(`Added ${qty} to your bag.`);
      if (buyNow) navigate('/checkout');
    } catch (err) {
      toast.error(err.message || 'Unable to add this item.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="page container">
      <nav className="breadcrumbs">
        <Link to="/">Home</Link><span>/</span>
        <Link to="/shop">Shop</Link><span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-detail">
        <div className="gallery">
          <div className="gallery-main">
            {images[activeImg] ? (
              <img src={images[activeImg]} alt={product.name || 'Product'} />
            ) : (
              <span className="placeholder">{(product.name || 'L').slice(0, 1)}</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((src, i) => (
                <button
                  key={i}
                  className={`thumb ${i === activeImg ? 'is-active' : ''}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <p className="product-category">{product.categories?.name || 'Luviio collection'}</p>
          <h1>{product.name}</h1>

          {product.short_description && (
            <p className="product-summary">{product.short_description}</p>
          )}

          <div className="product-price">
            <span className="now">{formatMoney(price)}</span>
            {compare > price && price > 0 && <span className="was">{formatMoney(compare)}</span>}
            {discount > 0 && <span className="save">Save {Math.round(discount)}%</span>}
          </div>

          <p className={`stock-note ${outOfStock ? 'out' : lowStock ? 'low' : 'in'}`}>
            {outOfStock ? 'Out of stock' : lowStock ? `Only ${stock} left in stock` : 'In stock'}
          </p>

          <div className="qty-row">
            <span>Qty</span>
            <div className="qty-stepper">
              <button onClick={() => setQty(clampQty(qty - 1))} aria-label="Decrease quantity"><RiSubtractLine size={16} /></button>
              <input
                type="number"
                min="1"
                max={Math.max(1, stock || 999)}
                value={qty}
                onChange={(e) => setQty(clampQty(e.target.value))}
                aria-label="Quantity"
              />
              <button onClick={() => setQty(clampQty(qty + 1))} aria-label="Increase quantity"><RiAddLine size={16} /></button>
            </div>
          </div>

          <div className="product-actions">
            <button className="btn" onClick={() => handleAdd(false)} disabled={outOfStock || adding}>
              <RiShoppingBagLine size={16} /> {adding ? 'Adding…' : 'Add to bag'}
            </button>
            <button className="btn btn-quiet" onClick={() => handleAdd(true)} disabled={outOfStock || adding}>
              <RiShuffleLine size={16} /> Buy now
            </button>
          </div>

          <p className="shipping-note"><RiTruckLine size={15} /> Free shipping on orders over the store threshold.</p>

          {Object.keys(attributes).length > 0 && (
            <dl className="attributes">
              {Object.entries(attributes).map(([k, v]) => (
                <div className="attribute-row" key={k}>
                  <dt>{String(k).replace(/_/g, ' ')}</dt>
                  <dd>{String(v)}</dd>
                </div>
              ))}
            </dl>
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
