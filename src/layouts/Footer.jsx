import { Link } from 'react-router-dom';
import {
  RiArrowRightUpLine,
  RiMailLine,
  RiMapPin2Line,
  RiShieldCheckLine,
} from '@remixicon/react';

import { APP_NAME } from '../config/env';

const SHOP_LINKS = [
  { to: '/shop', label: 'All products' },
  { to: '/shop?in_stock=1', label: 'In stock' },
  { to: '/cart', label: 'Your bag' },
];

const ACCOUNT_LINKS = [
  { to: '/account', label: 'Profile' },
  { to: '/orders', label: 'Order history' },
  { to: '/account/addresses', label: 'Addresses' },
];

const COMPANY_LINKS = [
  { to: '/about', label: 'About us' },
  { to: '/privacy', label: 'Privacy policy' },
  { to: '/terms', label: 'Terms & conditions' },
];

const HELP_LINKS = [
  { to: '/shipping', label: 'Shipping' },
  { to: '/returns', label: 'Returns & cancellation' },
  { to: '/refund', label: 'Refund policy' },
];

function FooterNav({ id, title, links }) {
  return (
    <nav
      className="min-w-0"
      aria-labelledby={id}
    >
      <h2
        id={id}
        className="mb-4 text-[11px] font-bold uppercase tracking-[.16em] text-dim"
      >
        {title}
      </h2>

      <ul className="grid gap-1.5">
        {links.map((link) => (
          <li key={`${link.to}-${link.label}`}>
            <Link
              className="group inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-[13px] leading-snug text-muted transition-colors hover:bg-white/[.035] hover:text-text focus-visible:bg-white/[.035] focus-visible:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              to={link.to}
            >
              <span>{link.label}</span>
              <RiArrowRightUpLine
                className="shrink-0 opacity-40 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5"
                size={14}
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  const brandName =
    typeof APP_NAME === 'string' &&
    APP_NAME.trim()
      ? APP_NAME.trim()
      : 'LUVIIO';

  return (
    <footer className="mt-16 border-t border-line bg-[#0c0b0a] text-text">
      <div className="mx-auto w-full max-w-[1440px] px-[clamp(16px,6vw,88px)]">
        <div className="grid min-w-0 grid-cols-[minmax(240px,1.5fr)_repeat(4,minmax(0,1fr))] gap-x-8 gap-y-12 py-14 max-[1000px]:grid-cols-2 max-[1000px]:gap-x-6 max-[1000px]:py-12 max-[620px]:grid-cols-1 max-[620px]:gap-y-9">
          <section
            className="min-w-0 max-[1000px]:col-span-2 max-[620px]:col-span-1"
            aria-labelledby="footer-brand-title"
          >
            <Link
              to="/"
              className="inline-flex rounded-lg font-display text-[34px] font-medium leading-none tracking-[-.035em] text-gold no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              aria-label={`${brandName} home`}
            >
              <span id="footer-brand-title">
                {brandName.toLowerCase()}
              </span>
            </Link>

            <p className="mt-4 max-w-[42ch] text-sm leading-6 text-muted">
              Practical essentials for everyday living —
              hardware, sanitary and drainage solutions
              from Luviio.
            </p>

            <div className="mt-6 grid gap-2.5">
              <span className="inline-flex min-h-10 items-center gap-2.5 text-xs text-muted">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-gold-soft">
                  <RiShieldCheckLine
                    size={15}
                    aria-hidden="true"
                  />
                </span>
                <span>Secure shopping</span>
              </span>

              <span className="inline-flex min-h-10 items-center gap-2.5 text-xs text-muted">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-gold-soft">
                  <RiMapPin2Line
                    size={15}
                    aria-hidden="true"
                  />
                </span>
                <span>Serving India</span>
              </span>
            </div>
          </section>

          <FooterNav
            id="footer-shop"
            title="Shop"
            links={SHOP_LINKS}
          />

          <FooterNav
            id="footer-account"
            title="Account"
            links={ACCOUNT_LINKS}
          />

          <FooterNav
            id="footer-company"
            title="Company"
            links={COMPANY_LINKS}
          />

          <section
            className="min-w-0"
            aria-labelledby="footer-help-title"
          >
            <FooterNav
              id="footer-help-title"
              title="Help"
              links={HELP_LINKS}
            />

            <a
              className="group mt-5 flex min-h-16 w-full items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3.5 text-left transition-colors hover:border-gold/60 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              href="mailto:support@luviio.in"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-bg text-gold-soft">
                <RiMailLine
                  size={16}
                  aria-hidden="true"
                />
              </span>

              <span className="min-w-0 flex-1">
                <strong className="block text-xs font-semibold text-text">
                  Need help?
                </strong>
                <span className="mt-0.5 block truncate text-[11px] text-muted">
                  support@luviio.in
                </span>
              </span>

              <RiArrowRightUpLine
                className="shrink-0 opacity-55 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                size={15}
                aria-hidden="true"
              />
            </a>
          </section>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-line-soft py-5 text-[11px] text-dim max-[620px]:items-start max-[620px]:flex-col">
          <p className="m-0">
            © {year} {brandName}. All rights reserved.
          </p>

          <p className="m-0">
            Made for the everyday.
          </p>
        </div>
      </div>
    </footer>
  );
}
