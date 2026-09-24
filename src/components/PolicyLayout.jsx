import {
  useEffect,
  useId,
  useRef,
} from 'react';
import { Link } from 'react-router-dom';

/**
 * Shared layout for static store pages:
 * policies, about, contact, terms, etc.
 *
 * Keeps content presentation consistent while allowing
 * each page to provide its own hero metadata and body.
 */
export default function PolicyLayout({
  eyebrow,
  title,
  lead,
  updated,
  children,
}) {
  const heroRef = useRef(null);
  const bodyRef = useRef(null);
  const titleId = useId();
  
  useEffect(() => {
    const hero = heroRef.current;
    const body = bodyRef.current;
    
    if (!hero || !body) return undefined;
    
    let cancelled = false;
    let animation;
    
    const prefersReducedMotion =
      window.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      ).matches;
    
    if (prefersReducedMotion) {
      return undefined;
    }
    
    import('gsap')
      .then(({ default: gsap }) => {
        if (cancelled) return;
        
        animation = gsap.fromTo(
          [hero, body],
          {
            y: 20,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.65,
            stagger: 0.08,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
          },
        );
      })
      .catch(() => {
        // Animation is progressive enhancement.
      });
    
    return () => {
      cancelled = true;
      animation?.kill();
    };
  }, []);
  
  const updatedAt = (() => {
    if (!updated) return null;
    
    const date = new Date(updated);
    
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  })();
  
  return (
    <main className="page policy-page">
      <div className="container policy-container">
        <nav
          className="breadcrumbs policy-breadcrumbs"
          aria-label="Breadcrumb"
        >
          <Link
            className="breadcrumbs-link"
            to="/"
          >
            Home
          </Link>

          <span
            className="breadcrumbs-separator"
            aria-hidden="true"
          >
            /
          </span>

          <span
            className="breadcrumbs-current"
            aria-current="page"
          >
            {title}
          </span>
        </nav>

        <header
          ref={heroRef}
          className="po-hero"
          aria-labelledby={titleId}
        >
          {eyebrow && (
            <p className="eyebrow po-eyebrow">
              {eyebrow}
            </p>
          )}

          <h1
            id={titleId}
            className="po-title"
          >
            {title}
          </h1>

          {lead && (
            <p className="po-lead">
              {lead}
            </p>
          )}

          {updatedAt && (
            <time
              className="po-updated"
              dateTime={new Date(updated).toISOString()}
            >
              Last updated — {updatedAt}
            </time>
          )}
        </header>

        <article
          ref={bodyRef}
          className="po-body"
        >
          {children}
        </article>
      </div>
    </main>
  );
}