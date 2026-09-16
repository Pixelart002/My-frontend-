import { request } from '../api/client';

export const locationService = {
  autocomplete: (query) => request('GET', `/locations/autocomplete?query=${encodeURIComponent(String(query || '').trim())}`),
  details: (placeId) => request('GET', `/locations/details/${encodeURIComponent(placeId)}`),
};
