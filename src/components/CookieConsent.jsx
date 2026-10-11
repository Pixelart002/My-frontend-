import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiCloseLine,
  RiCookieLine,
  RiSettings3Line,
  RiShieldCheckLine,
} from 'react-icons/ri';

const STORAGE_KEY = 'luviio-cookie-consent-v1';

const DEFAULT_PREFERENCES = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function readConsent() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !parsed.preferences) return null;

    return {
      version: 1,
      savedAt: parsed.savedAt || null,
      preferences: {
        necessary: true,
        analytics: parsed.preferences.analytics === true,
        marketing: parsed.preferences.marketing === true,
      },
    };
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const [consent, setConsent] = useState(undefined);
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  useEffect(() => {
    const saved = readConsent();
    setConsent(saved);
    if (saved) setPreferences(saved.preferences);
  }, []);

  const save = (nextPreferences) => {
    const record = {
      version: 1,
      savedAt: new Date().toISOString(),
      preferences: {
        necessary: true,
        analytics: nextPreferences.analytics === true,
        marketing: nextPreferences.marketing === true,
      },
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Keep the choice for this session even if storage is unavailable.
    }

    setPreferences(record.preferences);
    setConsent(record);
    setOpen(false);
    setCustomize(false);
    window.dispatchEvent(new CustomEvent('luviio:cookie-consent-changed', {
      detail: record,
    }));
  };

  if (consent === undefined) return null;

  if (consent && !open) {
    return (
      <button
        type="button"
        className="cookie-settings-trigger"
        onClick={() => {
          setPreferences(consent.preferences);
          setOpen(true);
          setCustomize(true);
        }}
        aria-label="Manage cookie preferences"
        title="Cookie preferences"
      >
        <RiCookieLine aria-hidden="true" size={19} />
      </button>
    );
  }

  return (
    <section
      className="cookie-consent"
      aria-labelledby="cookie-consent-title"
      role="region"
    >
      <div className="cookie-consent__icon" aria-hidden="true">
        <RiShieldCheckLine size={22} />
      </div>

      <div className="cookie-consent__content">
        <div className="cookie-consent__eyebrow">
          <RiCookieLine aria-hidden="true" size={15} />
          Your privacy, your choice
        </div>
        <h2 id="cookie-consent-title">
          {customize ? 'Cookie preferences' : 'Cookies that work for you'}
        </h2>
        <p>
          We use essential storage to make Luviio work. With your permission,
          optional analytics and marketing cookies can help us understand site
          usage and improve your shopping experience. You can change your choice
          at any time. Read our <Link to="/privacy">Privacy Policy</Link>.
        </p>

        {customize && (
          <div className="cookie-consent__options">
            <div className="cookie-consent__option">
              <div>
                <strong>Essential</strong>
                <span>Required for core site features and security.</span>
              </div>
              <label className="cookie-toggle">
                <input type="checkbox" checked disabled aria-label="Essential cookies always active" />
                <span className="cookie-toggle__track" />
                <em>Always on</em>
              </label>
            </div>

            <div className="cookie-consent__option">
              <div>
                <strong>Analytics</strong>
                <span>Helps us understand traffic and improve the store.</span>
              </div>
              <label className="cookie-toggle">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(event) => setPreferences((current) => ({ ...current, analytics: event.target.checked }))}
                />
                <span className="cookie-toggle__track" />
                <em className="sr-only">{preferences.analytics ? 'Enabled' : 'Disabled'}</em>
              </label>
            </div>

            <div className="cookie-consent__option">
              <div>
                <strong>Marketing</strong>
                <span>Allows marketing measurement and relevant promotions.</span>
              </div>
              <label className="cookie-toggle">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(event) => setPreferences((current) => ({ ...current, marketing: event.target.checked }))}
                />
                <span className="cookie-toggle__track" />
                <em className="sr-only">{preferences.marketing ? 'Enabled' : 'Disabled'}</em>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="cookie-consent__actions">
        {!customize ? (
          <>
            <button type="button" className="cookie-button cookie-button--quiet" onClick={() => save(DEFAULT_PREFERENCES)}>
              Reject optional
            </button>
            <button type="button" className="cookie-button cookie-button--outline" onClick={() => setCustomize(true)}>
              <RiSettings3Line aria-hidden="true" size={17} />
              Preferences
            </button>
            <button
              type="button"
              className="cookie-button cookie-button--primary"
              onClick={() => save({ necessary: true, analytics: true, marketing: true })}
            >
              Accept all
            </button>
          </>
        ) : (
          <>
            <button type="button" className="cookie-button cookie-button--quiet" onClick={() => setCustomize(false)}>
              Back
            </button>
            <button type="button" className="cookie-button cookie-button--outline" onClick={() => save(DEFAULT_PREFERENCES)}>
              Reject optional
            </button>
            <button type="button" className="cookie-button cookie-button--primary" onClick={() => save(preferences)}>
              Save choices
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        className="cookie-consent__close"
        onClick={() => {
          if (consent) setOpen(false);
          else setCustomize(true);
        }}
        aria-label={consent ? 'Close cookie preferences' : 'Customize cookie choices'}
      >
        <RiCloseLine size={18} aria-hidden="true" />
      </button>
    </section>
  );
}
