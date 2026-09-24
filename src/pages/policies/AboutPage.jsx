import { Link } from 'react-router-dom';
import PolicyLayout from '../../components/PolicyLayout';

const pillars = [
  {
    n: '01',
    t: 'Built for everyday use',
    d: 'We focus on practical hardware, sanitary and drainage products selected for real homes, shops and everyday spaces.',
  },
  {
    n: '02',
    t: 'Clear and dependable',
    d: 'Product details, pricing and essential information should be straightforward, so you can choose with confidence.',
  },
  {
    n: '03',
    t: 'Local service',
    d: 'Luviio combines online ordering with local store and supply support, helping customers get the products they actually need.',
  },
];

export default function AboutPage() {
  return (
    <PolicyLayout
      eyebrow="Our story"
      title="About Luviio"
      lead="Welcome to Luviio — a practical destination for hardware, sanitary and drainage products for everyday spaces."
    >
      <div className="po-lead-body" data-rise>
        <p>
          Luviio started with a simple idea: finding everyday hardware and
          sanitary products should be straightforward. Instead of making
          customers search through an overwhelming range of products, we aim
          to bring useful, relevant products together in one place.
        </p>

        <p>
          From drainage systems and floor drainers to sanitary and general
          hardware, our focus is on products that have a clear purpose in
          homes, shops, offices and other everyday spaces.
        </p>

        <p>
          We operate with a local-first approach, combining our physical
          store and supply experience with online ordering. Our goal is to
          keep product information clear, pricing transparent and service
          dependable from selection to delivery.
        </p>
      </div>

      <div className="about-pillars" data-rise>
        {pillars.map((pillar) => (
          <article
            className="about-pillar"
            key={pillar.n}
          >
            <span
              className="about-num"
              aria-hidden="true"
            >
              {pillar.n}
            </span>

            <h3>{pillar.t}</h3>

            <p>{pillar.d}</p>
          </article>
        ))}
      </div>

      <div className="po-cta" data-rise>
        <h3>Find what you need</h3>

        <p>
          Explore hardware, sanitary and drainage products
          selected for everyday use.
        </p>

        <Link
          className="btn"
          to="/shop"
        >
          Visit the shop
        </Link>
      </div>
    </PolicyLayout>
  );
}