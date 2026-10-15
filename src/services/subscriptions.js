import { request } from '../api/client';

const encodeId = (value) => encodeURIComponent(String(value));

export const subscriptionService = {
  plans: () => request('GET', '/subscriptions/plans?active_only=true'),
  current: () => request('GET', '/subscriptions/me'),
  subscribe: (planId) => request('POST', '/subscriptions/subscribe', { plan_id: planId }),
  cancel: (reason = null) => request('POST', '/subscriptions/cancel', reason ? { reason } : {}),
  reminders: () => request('GET', '/subscriptions/reminders'),
  dismissReminder: (id) => request('POST', `/subscriptions/reminders/${encodeId(id)}/dismiss`),
};
