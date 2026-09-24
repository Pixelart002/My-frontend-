/**
 * Location service — real backend location endpoints only.
 *
 * The backend remains responsible for:
 * - provider/API integration
 * - address resolution
 * - place details
 * - provider-specific validation
 */
import { request } from '../api/client';

function requireText(
  value,
  field,
) {
  const normalized =
    String(value ?? '').trim();
  
  if (!normalized) {
    throw new TypeError(
      `A valid ${field} is required.`,
    );
  }
  
  return normalized;
}

function normalizeLanguage(
  language,
) {
  const value =
    String(language ?? '').trim();
  
  return value || 'en';
}

function query(params) {
  const search =
    new URLSearchParams();
  
  Object.entries(params).forEach(
    ([key, value]) => {
      search.set(
        key,
        String(value),
      );
    },
  );
  
  return search.toString();
}

export const locationService = {
  autocomplete: (
    input,
    language = 'en',
  ) => {
    const searchInput =
      requireText(
        input,
        'location input',
      );
    
    return request(
      'GET',
      `/locations/autocomplete?${query({
        input: searchInput,
        language:
          normalizeLanguage(language),
      })}`,
    );
  },
  
  details: (
    placeId,
    language = 'en',
  ) => {
    const id =
      requireText(
        placeId,
        'place id',
      );
    
    return request(
      'GET',
      `/locations/details?${query({
        place_id: id,
        language:
          normalizeLanguage(language),
      })}`,
    );
  },
};