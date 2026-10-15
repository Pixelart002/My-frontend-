import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiArrowRightLine,
  RiCheckLine,
  RiCloseLine,
  RiVipCrownLine,
  RiRefreshLine,
  RiShieldCheckLine,
  RiTruckLine,
  RiVipCrownLine,
} from '@remixicon/react';

import { subscriptionService } from '../services/subscriptions';
import { useToast } from '../context/ToastContext';
import './subscription-page.css';

const tierRank = { free: 0, premium: 1, platinum: 2 };
const tierMeta = {
  free: { eyebrow: 'A good place to start', icon: RiShieldCheckLine },
  premium: { eyebrow: 'More value on every order', icon: RiVipCrownLine },
  platinum: { eyebrow: 'The complete member experience', icon: RiVipCrownLine },
};

function money(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Price unavailable';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amount % 1 ? 2 : 0,
  }).format(amount);
}

function dateLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(date);
}

function unwrapList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function benefitList(plan) {
  const tier = String(plan?.tier || 'free').toLowerCase();
  const benefits = [];
  if (tier === 'free') {
    benefits.push('Shop Luviio with no membership fee', 'Standard product pricing', 'Secure account and order tracking');
  } else {
    benefits.push('Free shipping on eligible orders', `${Number(tier === 'platinum' ? 10 : 5)}% member discount`, 'Access to member-only product ranges');
  }
  if (tier === 'platinum') benefits.push('Priority support', 'Early access to selected offers');
  if (plan?.description) benefits.unshift(plan.description);
  return [...new Set(benefits)];
}

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [membership, setMembership] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [planResult, currentResult, reminderResult] = await Promise.all([
        subscriptionService.plans(),
        subscriptionService.current(),
        subscriptionService.reminders().catch(() => []),
      ]);
      setPlans(unwrapList(planResult).filter((plan) => plan?.is_active !== false));
      setMembership(currentResult || null);
      setReminders(unwrapList(reminderResult).filter((item) => item.status !== 'dismissed'));
    } catch (error) {
      toast.error(error?.message || 'We couldn’t load membership details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const currentTier = String(membership?.tier || 'free').toLowerCase();
  const active = Boolean(membership?.active || (membership?.plan_id && membership?.ends_at && new Date(membership.ends_at) > new Date()));
  const sortedPlans = useMemo(() => [...plans].sort((a, b) => {
    const rank = (tierRank[String(a.tier || 'free').toLowerCase()] ?? 0) - (tierRank[String(b.tier || 'free').toLowerCase()] ?? 0);
    return rank || Number(a.price_inr || 0) - Number(b.price_inr || 0);
  }), [plans]);

  const choosePlan = async (plan) => {
    if (!plan?.id || actionId) return;
    if (active) {
      toast.info('You already have an active membership. Cancel it before choosing another plan.');
      return;
    }
    if (Number(plan.price_inr) > 0) {
      toast.info('Paid membership checkout is not enabled yet. No payment has been taken.');
      return;
    }
    setActionId(String(plan.id));
    try {
      await subscriptionService.subscribe(plan.id);
      toast.success('Your Luviio membership is active.');
      await load();
    } catch (error) {
      toast.error(error?.message || 'We couldn’t activate this plan.');
    } finally {
      setActionId('');
    }
  };

  const cancelMembership = async () => {
    if (cancelling) return;
    setCancelling(true);
    try {
      await subscriptionService.cancel('Cancelled by customer');
      toast.success('Membership cancelled.');
      setShowCancel(false);
      await load();
    } catch (error) {
      toast.error(error?.message || 'We couldn’t cancel your membership.');
    } finally {
      setCancelling(false);
    }
  };

  const dismissReminder = async (reminder) => {
    try {
      await subscriptionService.dismissReminder(reminder.id);
      setReminders((items) => items.filter((item) => item.id !== reminder.id));
    } catch (error) {
      toast.error(error?.message || 'Couldn’t dismiss this reminder.');
    }
  };

  return (
    <main className="subscription-page">
      <div className="sub-shell">
        <nav className="sub-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span aria-hidden="true">/</span><span>Membership</span>
        </nav>

        <header className="sub-hero">
          <div className="sub-hero-copy">
            <span className="sub-kicker"><span /> LUVIIO MEMBERSHIP</span>
            <h1>More value.<br /><em>Everyday.</em></h1>
            <p>Choose the membership that fits the way you shop. Clear benefits, no hidden surprises.</p>
            <a className="sub-hero-link" href="#membership-plans">Explore plans <RiArrowRightLine size={17} aria-hidden="true" /></a>
          </div>
          <div className="sub-hero-art" aria-hidden="true">
            <div className="sub-orbit sub-orbit-one" /><div className="sub-orbit sub-orbit-two" />
            <div className="sub-emblem"><RiVipCrownLine size={52} strokeWidth={1.2} /></div>
            <span className="sub-art-caption">MADE FOR YOUR EVERYDAY</span>
          </div>
        </header>

        {reminders.length > 0 && (
          <section className="sub-reminders" aria-label="Membership reminders">
            {reminders.map((reminder) => (
              <div className="sub-reminder" key={reminder.id}>
                <span><strong>{reminder.title || 'Membership reminder'}</strong><small>{reminder.body}</small></span>
                <button type="button" onClick={() => dismissReminder(reminder)} aria-label="Dismiss reminder"><RiCloseLine size={18} /></button>
              </div>
            ))}
          </section>
        )}

        {active && (
          <section className="sub-current" aria-label="Current membership">
            <div className="sub-current-icon"><RiCheckLine size={21} /></div>
            <div className="sub-current-copy">
              <span className="sub-status">YOUR CURRENT MEMBERSHIP</span>
              <h2>{membership?.plan_name || currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} <span>Active</span></h2>
              <p>{membership?.ends_at ? `Benefits available until ${dateLabel(membership.ends_at) || 'your expiry date'}.` : 'Your membership benefits are currently active.'}</p>
            </div>
            <button type="button" className="sub-cancel-link" onClick={() => setShowCancel(true)}>Cancel membership</button>
          </section>
        )}

        <section className="sub-plans-section" id="membership-plans">
          <div className="sub-section-heading">
            <div><span className="sub-kicker">CHOOSE YOUR LEVEL</span><h2>Membership plans</h2></div>
            <button className="sub-refresh" type="button" onClick={load} disabled={loading}><RiRefreshLine size={16} className={loading ? 'sub-spin' : ''} /> Refresh</button>
          </div>
          {loading ? (
            <div className="sub-state" role="status"><span className="sub-loader" /> Loading available plans…</div>
          ) : sortedPlans.length === 0 ? (
            <div className="sub-state"><RiVipCrownLine size={28} /><strong>No plans are available right now.</strong><span>Please check back soon.</span><button type="button" onClick={load}>Try again</button></div>
          ) : (
            <div className="sub-plan-grid">
              {sortedPlans.map((plan) => {
                const tier = String(plan.tier || 'free').toLowerCase();
                const meta = tierMeta[tier] || tierMeta.free;
                const Icon = meta.icon;
                const isCurrent = active && currentTier === tier && (!membership?.plan_id || membership.plan_id === plan.id);
                const paid = Number(plan.price_inr || 0) > 0;
                return (
                  <article className={`sub-plan-card sub-plan-${tier} ${tier === 'premium' ? 'sub-plan-featured' : ''}`} key={plan.id || `${tier}-${plan.name}`}>
                    {tier === 'premium' && <div className="sub-popular">MOST POPULAR</div>}
                    <div className="sub-plan-top"><span className="sub-plan-icon"><Icon size={22} /></span><span className="sub-plan-eyebrow">{meta.eyebrow}</span></div>
                    <h3>{plan.name || tier.charAt(0).toUpperCase() + tier.slice(1)}</h3>
                    <p className="sub-plan-description">{plan.description || (tier === 'free' ? 'The essentials to get started with Luviio.' : 'Extra benefits designed to make every order go further.')}</p>
                    <div className="sub-price">{money(plan.price_inr)}<span> / {Number(plan.duration_days || 30) === 365 ? 'year' : `${Number(plan.duration_days || 30)} days`}</span></div>
                    <div className="sub-duration">Membership duration: {Number(plan.duration_days || 30)} days</div>
                    <ul className="sub-benefits">{benefitList(plan).map((benefit) => <li key={benefit}><RiCheckLine size={17} aria-hidden="true" /><span>{benefit}</span></li>)}</ul>
                    <button
                      type="button"
                      className={`sub-plan-cta ${tier === 'premium' ? 'sub-plan-cta-gold' : ''}`}
                      disabled={Boolean(actionId) || isCurrent || (active && !isCurrent) || (paid && !active)}
                      onClick={() => choosePlan(plan)}
                    >
                      {actionId === String(plan.id) ? 'Activating…' : isCurrent ? 'Current plan' : active ? 'Already subscribed' : paid ? 'Paid checkout coming soon' : 'Choose plan'}
                      {!isCurrent && !active && !paid && <RiArrowRightLine size={17} aria-hidden="true" />}
                    </button>
                    {paid && !active && <p className="sub-checkout-note">Payment is not enabled for this plan yet.</p>}
                  </article>
                );
              })}
            </div>
          )}
          <p className="sub-footnote"><RiShieldCheckLine size={16} /> Plan pricing and availability are managed by Luviio. Product prices remain unchanged; membership benefits apply separately.</p>
        </section>

        <section className="sub-benefit-strip" aria-label="Membership highlights">
          <div><RiTruckLine size={21} /><span><strong>Shipping benefits</strong><small>Included on eligible memberships</small></span></div>
          <div><RiVipCrownLine size={21} /><span><strong>Member savings</strong><small>Tier-based discounts at checkout</small></span></div>
          <div><RiShieldCheckLine size={21} /><span><strong>Clear and secure</strong><small>Your membership stays in your account</small></span></div>
        </section>
      </div>

      {showCancel && (
        <div className="sub-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCancel(false); }}>
          <section className="sub-dialog" role="dialog" aria-modal="true" aria-labelledby="sub-cancel-title">
            <span className="sub-dialog-icon"><RiCloseLine size={22} /></span>
            <h2 id="sub-cancel-title">Cancel your membership?</h2>
            <p>This will end your active membership in Luviio. You can choose another plan later.</p>
            <div className="sub-dialog-actions"><button type="button" className="sub-secondary-button" onClick={() => setShowCancel(false)} disabled={cancelling}>Keep membership</button><button type="button" className="sub-danger-button" onClick={cancelMembership} disabled={cancelling}>{cancelling ? 'Cancelling…' : 'Confirm cancellation'}</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
