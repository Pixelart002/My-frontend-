import { Link } from 'react-router-dom';
import { RiArrowRightLine } from '@remixicon/react';

export default function NotFoundPage() {
  return (
    <div className="page container">
      <div className="error-page">
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <div className="divider-line" />
        <p className="error-sub">
          The page you're looking for seems to have wandered off. Perhaps it was too
          exclusive even for us.
        </p>
        <div className="error-actions">
          <Link className="btn" to="/">Back to Home</Link>
          <Link className="btn btn-quiet" to="/shop">
            Browse Shop <RiArrowRightLine size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
