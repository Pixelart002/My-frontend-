import { Link } from 'react-router-dom';
import PolicyLayout from '../../components/PolicyLayout';

/**
 * Story / about page. Motion is handled by PolicyLayout via the
 * global [data-rise] reveal. Presentational — no API data.
 */
export default function AboutPage() {
  const pillars = [
    { n: '01', t: 'Curated craft', d: 'Every piece is chosen with intent — considered materials, timeless design, and a finish that holds up to daily life.' },
    { n: '02', t: 'Made to last', d: 'We favour quality over clutter. Fewer, better things that keep their character wear after wear.' },
    { n: '03', t: 'Considered service', d: 'Clear pricing, honest shipping, and support that actually responds when you need it.' },
  ];

  return (
    <PolicyLayout
      eyebrow="Our story"
      title="About Luviio"
      lead="Luviio is a home for thoughtfully chosen goods — pieces with a point of view, made to be lived with."
    >
      <div className="po-lead-body" data-rise>
        <p>
          Luviio began with a simple idea: shopping should feel considered, not cluttered. We bring
          together a tight, well-chosen collection of goods — each one selected for how it looks, how
          it's made, and how it earns a place in your everyday.
        </p>
        <p>
          We believe in fewer, better things. That means working with people who take care with craft,
          being honest about materials and pricing, and treating every order as if it were our own.
        </p>
      </div>

      <div className="about-pillars" data-rise>
        {pillars.map((p) => (
          <div className="about-pillar" key={p.n}>
            <span className="about-num">{p.n}</span>
            <h3>{p.t}</h3>
            <p>{p.d}</p>
          </div>
        ))}
      </div>

      <div className="po-cta" data-rise>
        <h3>Shop the collection</h3>
        <p>Browse the latest arrivals and find something you'll keep for years.</p>
        <Link className="btn" to="/shop">Visit the shop</Link>
      </div>
    </PolicyLayout>
  );
}
