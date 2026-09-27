import { Link } from 'react-router-dom';
import PolicyLayout from '../../components/PolicyLayout';

const facts = [
  ['Brand', 'Luviio'],
  ['Focus', 'Hardware, sanitary & drainage products'],
  ['Market', 'India'],
  ['Model', 'Local store + supply + online ordering'],
];

const pillars = [
  {
    n: '01',
    t: 'Everyday essentials',
    d: 'Practical hardware, sanitary and drainage products selected for homes, shops, offices and everyday spaces.',
  },
  {
    n: '02',
    t: 'Clear information',
    d: 'We keep product details, pricing and essential buying information straightforward and easy to understand.',
  },
  {
    n: '03',
    t: 'Local-first service',
    d: 'Luviio combines physical store and supply experience with online ordering for customers in India.',
  },
];

export default function AboutPage() {
  return (
    <PolicyLayout
      eyebrow="About the brand"
      title="Luviio — everyday hardware & sanitary essentials"
      lead="Luviio is an India-focused brand for practical hardware, sanitary and drainage products, built around simple product discovery and dependable everyday service."
    >
      <section className="about-source-card" data-rise aria-labelledby="about-source-title">
        <div className="about-source-head">
          <span className="about-source-mark" aria-hidden="true">L</span>
          <div>
            <p className="about-source-kicker">About this brand</p>
            <h2 id="about-source-title">luviio.in</h2>
          </div>
        </div>

        <p className="about-source-description">
          This website is the public Luviio brand and product-discovery surface.
          It provides information about Luviio, its product categories and
          useful guides, with links into the online shopping experience.
        </p>

        <div className="about-facts" aria-label="Luviio facts">
          {facts.map(([label, value]) => (
            <div className="about-fact" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="po-lead-body" data-rise>
        <p>
          Luviio started with a simple idea: finding everyday hardware and
          sanitary products should be straightforward. We bring useful,
          relevant products together so customers can understand what they
          are buying before they shop.
        </p>

        <p>
          Our range includes drainage systems, floor drainers, sanitary
          products and general hardware for practical use across homes,
          shops and other everyday spaces.
        </p>

        <p>
          Luviio follows a local-first approach, combining physical store and
          supply experience with online ordering. Product information and
          commercial decisions are kept clear, while ordering and checkout
          are handled through the ecommerce application.
        </p>
      </div>

      <div className="about-pillars" data-rise>
        {pillars.map((pillar) => (
          <article className="about-pillar" key={pillar.n}>
            <span className="about-num" aria-hidden="true">{pillar.n}</span>
            <h3>{pillar.t}</h3>
            <p>{pillar.d}</p>
          </article>
        ))}
      </div>

      <section className="about-where-to-go" data-rise aria-label="Luviio websites">
        <div>
          <span className="about-source-kicker">Where to go</span>
          <h2>Discover Luviio</h2>
          <p>
            Explore the public brand and product information, then continue
            to the shopping experience when you are ready to order.
          </p>
        </div>

        <div className="about-links">
          <Link className="btn" to="/">Explore Luviio</Link>
          <Link className="btn btn-secondary" to="/shop">Shop products</Link>
        </div>
      </section>
    </PolicyLayout>
  );
}
