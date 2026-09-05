import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

/**
 * Shared layout for static store pages (policies, about, contact).
 * Renders a hero header, breadcrumb, and a styled prose block.
 */
export default function PolicyLayout({ eyebrow, title, lead, updated, children }) {
  useEffect(() => {
    const els = document.querySelectorAll('[data-rise]');
    if (!els.length) return;
    const tween = gsap.fromTo(
      els,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power2.out' }
    );
    return () => tween.kill();
  }, []);

  const updatedAt = updated
    ? new Date(updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="page">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>{title}</span>
        </nav>

        <header className="po-hero" data-rise>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="po-title">{title}</h1>
          {lead && <p className="po-lead">{lead}</p>}
          {updatedAt && <p className="po-updated">Last updated — {updatedAt}</p>}
        </header>

        <div className="po-body" data-rise>{children}</div>
      </div>
    </div>
  );
}
