import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Link,
  useSearchParams,
} from 'react-router-dom';
import {
  RiSendPlaneLine,
  RiStarFill,
  RiStarLine,
} from '@remixicon/react';
import { reviewService } from '../services/reviews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ErrorState,
  Spinner,
} from '../components/ui/States';
import '../styles/reviews.css';

const MIN_RATING = 1;
const MAX_RATING = 5;
const MAX_TITLE_LENGTH = 120;
const MIN_BODY_LENGTH = 3;
const MAX_BODY_LENGTH = 2000;

function text(value, fallback = '') {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const result = String(value).trim();

  return result || fallback;
}

function normalizeRating(value) {
  const rating = Number(value);

  if (
    !Number.isFinite(rating) ||
    rating < MIN_RATING ||
    rating > MAX_RATING
  ) {
    return 0;
  }

  return Math.round(rating);
}

function formatReviewDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  );
}

function normalizeReviews(value) {
  if (Array.isArray(value)) {
    return value.filter(
      (review) =>
        review &&
        typeof review === 'object',
    );
  }

  if (
    Array.isArray(value?.items)
  ) {
    return value.items.filter(
      (review) =>
        review &&
        typeof review === 'object',
    );
  }

  if (
    Array.isArray(value?.data)
  ) {
    return value.data.filter(
      (review) =>
        review &&
        typeof review === 'object',
    );
  }

  return [];
}

function Stars({
  value = 0,
  interactive = false,
  onChange,
  disabled = false,
}) {
  const rating = normalizeRating(value);

  const handleChange = (nextRating) => {
    if (
      !interactive ||
      disabled ||
      typeof onChange !== 'function'
    ) {
      return;
    }

    onChange(nextRating);
  };

  return (
    <div
      className="review-stars"
      role={
        interactive
          ? 'radiogroup'
          : undefined
      }
      aria-label={
        interactive
          ? 'Choose a rating from 1 to 5 stars'
          : `${rating} out of 5 stars`
      }
    >
      {[1, 2, 3, 4, 5].map(
        (star) => {
          const selected =
            star <= rating;

          if (!interactive) {
            return selected ? (
              <RiStarFill
                key={star}
                size={16}
                aria-hidden="true"
              />
            ) : (
              <RiStarLine
                key={star}
                size={16}
                aria-hidden="true"
              />
            );
          }

          return (
            <button
              key={star}
              type="button"
              className="review-star-btn"
              role="radio"
              aria-label={`${star} star${
                star > 1 ? 's' : ''
              }`}
              aria-checked={
                rating === star
              }
              onClick={() =>
                handleChange(star)
              }
              disabled={disabled}
            >
              {selected ? (
                <RiStarFill
                  size={20}
                  aria-hidden="true"
                />
              ) : (
                <RiStarLine
                  size={20}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        },
      )}
    </div>
  );
}

export default function ReviewsPage() {
  const [params] =
    useSearchParams();

  const productId =
    text(params.get('product'));

  const { isAuthenticated } =
    useAuth();

  const { toast } =
    useToast();

  const [reviews, setReviews] =
    useState(null);

  const [error, setError] =
    useState('');

  const [rating, setRating] =
    useState(5);

  const [title, setTitle] =
    useState('');

  const [body, setBody] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const mountedRef =
    useRef(false);

  const requestVersionRef =
    useRef(0);

  const savingRef =
    useRef(false);

  const load = useCallback(
    async () => {
      const requestVersion =
        ++requestVersionRef.current;

      if (!productId) {
        if (
          mountedRef.current
        ) {
          setReviews(null);
          setError(
            'Choose a product to view reviews.',
          );
        }

        return;
      }

      setError('');

      try {
        const result =
          await reviewService.listForProduct(
            productId,
          );

        if (
          !mountedRef.current ||
          requestVersion !==
            requestVersionRef.current
        ) {
          return;
        }

        setReviews(result);
      } catch (err) {
        if (
          !mountedRef.current ||
          requestVersion !==
            requestVersionRef.current
        ) {
          return;
        }

        setReviews(null);
        setError(
          err?.message ||
            'Unable to load reviews.',
        );
      }
    },
    [productId],
  );

  useEffect(() => {
    mountedRef.current = true;

    load();

    return () => {
      mountedRef.current = false;
      requestVersionRef.current += 1;
    };
  }, [load]);

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (savingRef.current) {
      return;
    }

    if (!productId) {
      toast.error(
        'Choose a product before submitting a review.',
      );
      return;
    }

    if (!isAuthenticated) {
      toast.info(
        'Please sign in to review a purchased product.',
      );
      return;
    }

    const normalizedTitle =
      title.trim();

    const normalizedBody =
      body.trim();

    const normalizedRating =
      normalizeRating(rating);

    if (
      normalizedRating <
        MIN_RATING ||
      normalizedRating >
        MAX_RATING
    ) {
      toast.error(
        'Please choose a rating from 1 to 5 stars.',
      );
      return;
    }

    if (
      normalizedTitle.length >
      MAX_TITLE_LENGTH
    ) {
      toast.error(
        `Review title must be ${MAX_TITLE_LENGTH} characters or fewer.`,
      );
      return;
    }

    if (
      normalizedBody.length <
      MIN_BODY_LENGTH
    ) {
      toast.error(
        `Review must be at least ${MIN_BODY_LENGTH} characters.`,
      );
      return;
    }

    if (
      normalizedBody.length >
      MAX_BODY_LENGTH
    ) {
      toast.error(
        `Review must be ${MAX_BODY_LENGTH} characters or fewer.`,
      );
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      await reviewService.create(
        productId,
        {
          rating: normalizedRating,
          title:
            normalizedTitle ||
            undefined,
          body: normalizedBody,
        },
      );

      if (
        !mountedRef.current
      ) {
        return;
      }

      toast.success(
        'Review submitted. It will appear after moderation.',
      );

      setTitle('');
      setBody('');
      setRating(5);

      await load();
    } catch (err) {
      if (
        mountedRef.current
      ) {
        toast.error(
          err?.message ||
            'Unable to submit review.',
        );
      }
    } finally {
      savingRef.current = false;

      if (
        mountedRef.current
      ) {
        setSaving(false);
      }
    }
  };

  if (error) {
    return (
      <div className="page container">
        <ErrorState
          message={error}
          onRetry={load}
        />
      </div>
    );
  }

  if (!reviews) {
    return (
      <div className="page container">
        <Spinner label="Loading reviews…" />
      </div>
    );
  }

  const items =
    normalizeReviews(reviews);

  return (
    <div className="page container reviews-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            Customer feedback
          </p>

          <h1>
            Product reviews
          </h1>

          <p>
            Verified-purchase reviews
            help other Luviio customers
            buy with confidence.
          </p>
        </div>

        <Link
          className="btn btn-quiet"
          to="/shop"
        >
          Continue shopping
        </Link>
      </div>

      <div className="reviews-layout">
        <section
          className="reviews-list"
          aria-labelledby="published-reviews-heading"
        >
          <h2
            id="published-reviews-heading"
            className="sr-only"
          >
            Published reviews
          </h2>

          {items.length > 0 ? (
            items.map((review, index) => {
              const reviewId =
                text(
                  review.id,
                  `review-${index}`,
                );

              const reviewRating =
                normalizeRating(
                  review.rating,
                );

              const reviewDate =
                formatReviewDate(
                  review.created_at,
                );

              const reviewTitle =
                text(
                  review.title,
                  'Customer review',
                );

              const reviewBody =
                text(
                  review.body,
                  'No review text provided.',
                );

              const authorName =
                text(
                  review.author_name,
                  'Luviio customer',
                );

              return (
                <article
                  className="review-card"
                  key={reviewId}
                >
                  <div className="review-card-head">
                    <div>
                      <Stars
                        value={
                          reviewRating
                        }
                      />

                      <h2>
                        {reviewTitle}
                      </h2>
                    </div>

                    <span>
                      {authorName}
                    </span>
                  </div>

                  <p>
                    {reviewBody}
                  </p>

                  {reviewDate && (
                    <time
                      dateTime={
                        review.created_at
                      }
                    >
                      {reviewDate}
                    </time>
                  )}
                </article>
              );
            })
          ) : (
            <div className="empty-state">
              <h2>
                No published reviews yet
              </h2>

              <p>
                Be the first verified
                customer to share your
                experience.
              </p>
            </div>
          )}
        </section>

        <aside
          className="review-form-card"
          aria-labelledby="review-form-heading"
        >
          <p className="eyebrow">
            Have you bought it?
          </p>

          <h2 id="review-form-heading">
            Share your experience
          </h2>

          <p>
            Only customers with a
            delivered order containing
            this product can submit a
            review.
          </p>

          {isAuthenticated ? (
            <form
              onSubmit={handleSubmit}
              className="review-form"
              noValidate
              aria-busy={saving}
            >
              <div className="field">
                <span
                  id="review-rating-label"
                  className="sr-only"
                >
                  Rating
                </span>

                <Stars
                  value={rating}
                  interactive
                  onChange={setRating}
                  disabled={saving}
                />
              </div>

              <div className="field">
                <label htmlFor="review-title">
                  Title
                </label>

                <input
                  id="review-title"
                  name="title"
                  type="text"
                  maxLength={
                    MAX_TITLE_LENGTH
                  }
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                  placeholder="What stood out?"
                  disabled={saving}
                />
              </div>

              <div className="field">
                <label htmlFor="review-body">
                  Review
                </label>

                <textarea
                  id="review-body"
                  name="body"
                  required
                  minLength={
                    MIN_BODY_LENGTH
                  }
                  maxLength={
                    MAX_BODY_LENGTH
                  }
                  rows={6}
                  value={body}
                  onChange={(event) =>
                    setBody(
                      event.target.value,
                    )
                  }
                  placeholder="Tell other customers about the product."
                  disabled={saving}
                />
              </div>

              <button
                className="btn"
                type="submit"
                disabled={
                  saving ||
                  !body.trim()
                }
                aria-busy={saving}
              >
                <RiSendPlaneLine
                  size={16}
                  aria-hidden="true"
                />

                {saving
                  ? 'Submitting…'
                  : 'Submit review'}
              </button>
            </form>
          ) : (
            <Link
              className="btn"
              to="/login"
            >
              Sign in to review
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}