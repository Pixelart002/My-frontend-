/** @type {import('tailwindcss').Config} */
module.exports = {
 content: [
  './*.html',
  './js/**/*.js',
 ],
 theme: {
  extend: {
   colors: {
    // 🔥 Unified from about/admin/index/orders/privacy/profile/terms.html
    // (previously each page hardcoded slightly different hex values for
    // the "same" token — e.g. `error` was #e05252 on some pages and
    // #f87171 on others). Now backed by CSS variables in css/luviio.css
    // so there's exactly one source of truth, with the old value kept
    // as the fallback so nothing visually shifts if a var is missing.
    gold: 'var(--gold, #c9a55e)',
    'gold-dim': 'var(--gold-dim, rgba(201,165,94,0.12))',
    surface: 'var(--surface, #0d0c0a)',
    'surface-2': 'var(--surface-2, #141210)',
    border: 'var(--border, #1e1c18)',
    'border-light': 'var(--border-light, #2a2722)',
    text: 'var(--text, #f0ece4)',
    'text-muted': 'var(--text-muted, #7a7368)',
    'text-dim': 'var(--text-dim, #3a3730)',
    bg: 'var(--bg, #121212)',
    success: 'var(--success, #4ade80)',
    'success-dim': 'var(--success-dim, rgba(74,222,128,0.12))',
    error: 'var(--error, #e05252)',
    'error-dim': 'var(--error-dim, rgba(224,82,82,0.12))',
    warn: 'var(--warn, #e0a952)',
   },
   fontFamily: {
    display: ['"Playfair Display"', 'serif'],
    serif: ['"Playfair Display"', 'serif'],
    body: ['"DM Sans"', 'sans-serif'],
    sans: ['"DM Sans"', 'sans-serif'],
   },
   animation: {
    'fade-up': 'fadeUp 0.6s ease forwards',
    'fade-in': 'fadeIn 0.5s ease forwards',
    'scale-in': 'scaleIn 0.5s cubic-bezier(.175,.885,.32,1.275) forwards',
    shimmer: 'shimmer 0.75s ease forwards',
    marquee: 'marquee 30s linear infinite',
    'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
    slideDown: 'slideDown 0.3s ease forwards',
    'spin-fast': 'spin 0.8s linear infinite',
   },
   keyframes: {
    fadeUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
    fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
    scaleIn: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
    shimmer: { '0%': { transform: 'translateX(-130%) skewX(-12deg)' }, '100%': { transform: 'translateX(130%) skewX(-12deg)' } },
    marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
    pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
    slideDown: { '0%': { opacity: '0', transform: 'translateY(-8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
    spin: { '100%': { transform: 'rotate(360deg)' } },
   },
  },
 },
 plugins: [],
};