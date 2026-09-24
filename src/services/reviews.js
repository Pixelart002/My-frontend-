/**
 * Reviews service — real backend endpoints only.
 *
 * Backend remains authoritative for:
 * - review eligibility
 * - delivered-order requirements
 * - duplicate-review rules
 * - moderation
 * - review status
 * - rating/content validation
 */
import { request } from '../api/client';
import {
  asId,
  asTrimmedString,
} from '../utils/dataTypes';

const REVIEW_STATUSES = new Set([
  'pending',
  'approved',
  'rejected',
]);

function requireId(
  value,
  field,
) {
  const id = asId(value);

  if (!id) {
    throw new TypeError(
      `A valid ${field} is required.`,
    );
  }

  return id;
}

function requireReviewStatus(
  value,
) {
  const status =
    asTrimmedString(value)
      .toLowerCase();

  if (
    !REVIEW_STATUSES.has(status)
  ) {
    throw new TypeError(
      'A valid review status is required.',
    );
  }

  return status;
}

export const reviewService = {
  listForProduct: (
    productId,
  ) =>
    request(
      'GET',
      `/reviews/products/${encodeURIComponent(
        requireId(
          productId,
          'product id',
        ),
      )}`,
    ),

  create: (
    productId,
    data,
  ) => {
    const id =
      requireId(
        productId,
        'product id',
      );

    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data)
    ) {
      throw new TypeError(
        'Review data is required.',
      );
    }

    return request(
      'POST',
      `/reviews/products/${encodeURIComponent(
        id,
      )}`,
      data,
    );
  },

  mine: () =>
    request(
      'GET',
      '/reviews/me',
    ),

  adminList: (
    status = null,
  ) => {
    const value =
      asTrimmedString(status);

    if (!value) {
      return request(
        'GET',
        '/reviews/admin',
      );
    }

    const params =
      new URLSearchParams({
        status_filter:
          value,
      });

    return request(
      'GET',
      `/reviews/admin?${params.toString()}`,
    );
  },

  moderate: (
    id,
    status,
  ) =>
    request(
      'PATCH',
      `/reviews/admin/${encodeURIComponent(
        requireId(
          id,
          'review id',
        ),
      )}`,
      {
        status:
          requireReviewStatus(
            status,
          ),
      },
    ),
};