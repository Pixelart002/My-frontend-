import { Link } from 'react-router-dom';
import { RiArrowRightLine } from '@remixicon/react';

export default function NotFoundPage() {
  return (
    <div className="page container">
      <section
        className="error-page"
        aria-labelledby="not-found-title"
        role="status"
      >
        <div
          className="error-code"
          aria-hidden="true"
        >
          404
        </div>

        <h1
          id="not-found-title"
          className="error-title"
        >
          Page Not Found
        </h1>

        <div
          className="divider-line"
          aria-hidden="true"
        />

        <p className="error-sub">
          The page you’re looking for doesn’t exist or may have
          moved. You can return home or continue browsing the
          Luviio catalogue.
        </p>

        <nav
          className="error-actions"
          aria-label="Page recovery options"
        >
          <Link
            className="btn"
            to="/"
          >
            Back to Home
          </Link>

          <Link
            className="btn btn-quiet"
            to="/shop"
          >
            Browse Shop
            <RiArrowRightLine
              size={16}
              aria-hidden="true"
            />
          </Link>
        </nav>
      </section>
    </div>
  );
}