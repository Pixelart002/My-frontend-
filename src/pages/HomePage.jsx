import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { productService } from '../services/products';
import ProductCard from '../components/ProductCard';
import { ProductSkeletons, ErrorState } from '../components/ui/States';

const CATEGORY_CARDS = [
  { slug: 'bath', index: '01', title: 'Bath & body', text: 'Soft textures and considered essentials for your daily reset.' },
  { slug: 'home', index: '02', title: 'Home comforts', text: 'Small details that bring warmth, order, and character home.' },
];

export default function HomePage() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [catLinks, setCatLinks] = useState(CATEGORY_CARDS);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [data, categories] = await Promise.all([
          productService.list({ page: 1, page_size: 8 }),
          productService.categories(),
        ]);
        if (!active) return;
        const items = Array.isArray(data) ? data : data?.items || [];
        setProducts(items);

        // Build a live category list from the backend so links match real slugs.
        if (Array.isArray(categories) && categories.length > 0) {
          setCatLinks(
            categories.slice(0, 4).map((c, i) => ({
              slug: c.slug,
              index: String(i + 1).padStart(2, '0'),
              title: c.name,
              text: `Explore the store’s ${c.name.toLowerCase()} edit.`,
            })),
          );
        }
      } catch (err) {
        if (active) setError(err.message || 'Unable to load the store.');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Thoughtful things, beautifully made</p>
          <h1>Make room for <em>the good things.</em></h1>
          <p className="hero-text">
            Everyday pieces that make your space feel more like yours — from elevated bath
            essentials to objects worth keeping.
          </p>
          <div className="hero-actions">
            <Link className="btn" to="/shop">
              Explore the collection <ArrowRight size={16} />
            </Link>
            <Link className="btn btn-quiet" to="/shop?new=1">
              New arrivals
            </Link>
          </div>
        </div>
        <span className="scroll-note">Scroll to discover</span>
      </section>

      <section className="section">
        <div className="section-intro">
          <p className="eyebrow">The Luviio edit</p>
          <h2 className="section-title">Things you use. <em>Things you love.</em></h2>
          <p>A small, considered collection for slow mornings, clean spaces, and everyday rituals.</p>
        </div>

        <div className="category-grid">
          {catLinks.slice(0, 2).map((cat, i) => {
            const isGold = i === 1;
            return (
              <Link key={cat.slug} className={`category-card ${isGold ? 'gold' : ''}`} to={`/shop?category=${encodeURIComponent(cat.slug)}`}>
                <span>{cat.index} / Category</span>
                <div>
                  <h3>{cat.title}</h3>
                  <p>{cat.text}</p>
                  <strong>Explore <ArrowUpRight size={15} /></strong>
                </div>
              </Link>
            );
          })}
          <Link className="category-card" to="/shop">
            <span>00 / All</span>
            <div>
              <h3>Shop everything</h3>
              <p>Fresh finds, just in — selected for the way you live now.</p>
              <strong>Browse the full edit <ArrowUpRight size={15} /></strong>
            </div>
          </Link>
        </div>
      </section>

      <section className="section statement">
        <div>
          <p className="eyebrow">A better everyday</p>
          <h2 className="section-title">Good design, <em>no fuss.</em></h2>
        </div>
        <p>
          We look for useful, beautiful products made to last. No clutter. No throwaway trends.
          Just things that earn their place.
        </p>
      </section>

      <section className="section">
        <div className="section-intro">
          <p className="eyebrow">From the store</p>
          <h2 className="section-title">A few favourites</h2>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : products === null ? (
          <ProductSkeletons count={4} />
        ) : products.length === 0 ? (
          <div className="state"><p>Products are coming soon.</p></div>
        ) : (
          <>
            <div className="products-grid products-grid-3">
              {products.slice(0, 3).map((p) => (
                <ProductCard key={p.id || p.slug} product={p} />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Link className="btn btn-quiet" to="/shop">
                View all products <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
