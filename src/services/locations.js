import { request } from '../api/client';

export const locationService = {
  autocomplete: (input, language = 'en') => request('GET', `/locations/autocomplete?input=${encodeURIComponent(String(input || '').trim())}&language=${encodeURIComponent(language)}`),
  details: (placeId, language = 'en') => request('GET', `/locations/details?place_id=${encodeURIComponent(String(placeId || '').trim())}&language=${encodeURIComponent(language)}`),
};
