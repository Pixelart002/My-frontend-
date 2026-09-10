import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RiArrowRightLine, RiGridLine, RiToolsLine, RiWaterFlashLine, RiDropLine, RiHomeGearLine } from '@remixicon/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { productService } from '../services/products';
import ProductCard from '../components/ProductCard';
import { ProductSkeletons, ErrorState } from '../components/ui/States';

gsap.registerPlugin(ScrollTrigger);

const CATEGORY_CARDS = [
  { slug: 'drainage-systems', title: 'Drainage Systems', icon: RiGridLine },
  { slug: 'sanitary', title: 'Sanitary', icon: RiDropLine },
  { slug: 'pipes-fittings', title: 'Pipes & Fittings', icon: RiWaterFlashLine },
  { slug: 'bathroom-accessories', title: 'Bathroom Accessories', icon: RiHomeGearLine },
  { slug: 'hardware', title: 'Hardware', icon: RiToolsLine },
  { slug: 'showers', title: 'Showers', icon: RiDropLine },
];

export default function HomePage() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [catLinks, setCatLinks] = useState(CATEGORY_CARDS);

  const loadStore = useCallback(async () => {
    setError('');
    try {
      const [data, categories] = await Promise.all([
        productService.list({ page: 1, page_size: 8 }),
        productService.categories(),
      ]);
      setProducts(Array.isArray(data) ? data : data?.items || []);
      if (Array.isArray(categories) && categories.length) {
        const known = new Map(CATEGORY_CARDS.map((c) => [c.title.toLowerCase(), c]));
        setCatLinks(categories.slice(0, 6).map((c, i) => ({ ...(known.get(String(c.name || '').toLowerCase()) || CATEGORY_CARDS[i] || CATEGORY_CARDS[0]), slug: c.slug, title: c.name })));
      }
    } catch (err) {
      setError(err.message || 'Unable to load the store.');
    }
  }, []);

  useEffect(() => { loadStore(); }, [loadStore]);

  useEffect(() => {
    const root = document.querySelector('.home-landing');
    if (!root) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-rise]', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, stagger: 0.08, ease: 'power3.out' });
      gsap.utils.toArray('[data-reveal]').forEach((el) => gsap.fromTo(el, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <main className="home-landing">
      <section className="hero hero-reference">
        <div className="hero-reference-image" aria-hidden="true" />
        <div className="hero-reference-inner">
          <div className="hero-reference-copy">
            <p className="eyebrow" data-rise>Hardware&nbsp;&nbsp;/&nbsp;&nbsp; Sanitary&nbsp;&nbsp;/&nbsp;&nbsp; Drainage</p>
            <h1 data-rise>Welcome to<br /><em>Luviio</em></h1>
            <p className="hero-text" data-rise>Modern hardware and sanitary solutions for a cleaner, safer and better tomorrow.</p>
            <div className="hero-actions" data-rise><Link className="btn hero-reference-btn" to="/shop">Shop Now <RiArrowRightLine size={17} /></Link></div>
            <div className="hero-benefits" data-rise>
              <div><RiDropLine size={27} /><span><strong>Free Shipping</strong><small>On orders above ₹1,499</small></span></div>
              <div><RiHomeGearLine size={27} /><span><strong>Secure Payments</strong><small>Stripe Checkout</small></span></div>
              <div><RiToolsLine size={27} /><span><strong>Quality Products</strong><small>Built to last</small></span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section home-category-section" data-reveal>
        <div className="section-heading-row"><h2 className="section-title">Shop by Category</h2><Link className="section-view-all" to="/categories">View All Categories <RiArrowRightLine size={17} /></Link></div>
        <div className="home-category-grid">
          {catLinks.map((cat) => { const Icon = cat.icon || RiGridLine; return <Link key={cat.slug} className="home-category-card" to={`/shop?category=${encodeURIComponent(cat.slug)}`}><Icon className="home-category-icon" size={38} strokeWidth={1.25} /><span>{cat.title}</span><RiArrowRightLine className="home-category-arrow" size={17} /></Link>; })}
        </div>
      </section>

      <section className="section home-products-section" data-reveal>
        <div className="section-heading-row"><div><p className="eyebrow">From the store</p><h2 className="section-title">Featured products</h2></div><Link className="section-view-all" to="/shop">View All Products <RiArrowRightLine size={17} /></Link></div>
        {error ? <ErrorState message={error} onRetry={loadStore} /> : products === null ? <ProductSkeletons count={4} /> : products.length === 0 ? <div className="state"><p>The catalogue is currently empty. Check back soon for new products.</p><Link className="btn btn-quiet btn-sm" to="/shop">Browse shop</Link></div> : <div className="products-grid products-grid-4">{products.slice(0, 4).map((p) => <ProductCard key={p.id || p.slug} product={p} />)}</div>}
      </section>
    </main>
  );
}
