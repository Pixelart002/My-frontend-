/* ============================================================
   LUVIIO — Utils  (XSS-safe helpers, formatters, toasts)
   ============================================================ */

/* ── XSS Prevention ──────────────────────────────────────── */
function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

// Safe text setter — never use innerHTML with user content
function setText(el, text) {
  if (el) el.textContent = text ?? '';
}

// Build a safe attribute string
function safeAttr(val) {
  return escapeHTML(String(val ?? ''));
}

/* ── Currency / Date formatters ──────────────────────────── */
function formatPrice(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ── URL query helpers ───────────────────────────────────── */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Prevent open redirect: only allow same-origin paths (must start with / but NOT //)
function safeRedirect(url, fallback = '/index.html') {
  if (!url) return fallback;
  if (/^\/[^/]/.test(url) || url === '/') return url;
  return fallback;
}

/* ── Input validation ────────────────────────────────────── */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function validatePassword(pass) {
  const errors = [];
  if (pass.length < 8)            errors.push('Minimum 8 characters');
  if (!/[A-Z]/.test(pass))        errors.push('At least one uppercase letter');
  if (!/[0-9]/.test(pass))        errors.push('At least one number');
  return errors;
}

/* ── Toast notification system ───────────────────────────── */
(function initToasts() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText =
    'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:12px;pointer-events:none;';
  document.body.appendChild(container);
})();

function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const colors = {
    info:    { bg: '#1c1c1c', border: '#c9a96e', icon: 'ℹ' },
    success: { bg: '#1c1c1c', border: '#5ec789', icon: '✓' },
    error:   { bg: '#1c1c1c', border: '#e05252', icon: '✕' },
    warn:    { bg: '#1c1c1c', border: '#e0a952', icon: '⚠' },
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.style.cssText = `
    background:${c.bg};border-left:3px solid ${c.border};
    color:#f0ece4;padding:14px 18px;border-radius:6px;
    font-family:'DM Sans',sans-serif;font-size:14px;
    box-shadow:0 4px 20px rgba(0,0,0,0.5);
    pointer-events:auto;cursor:pointer;
    display:flex;align-items:center;gap:10px;
    min-width:260px;max-width:380px;
    opacity:0;transform:translateX(20px);
    transition:opacity 0.3s,transform 0.3s;
  `;

  const icon = document.createElement('span');
  icon.style.cssText = `color:${c.border};font-weight:700;font-size:16px;flex-shrink:0;`;
  icon.textContent = c.icon;

  const msg = document.createElement('span');
  msg.textContent = message; // textContent — XSS safe

  toast.appendChild(icon);
  toast.appendChild(msg);
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });

  const remove = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  };

  toast.addEventListener('click', remove);
  setTimeout(remove, duration);
}

/* ── Loading overlay ─────────────────────────────────────── */
function showLoader(el, text = 'Loading…') {
  if (!el) return;
  el.dataset.originalText = el.textContent;
  el.disabled = true;
  el.textContent = text;
}

function hideLoader(el) {
  if (!el) return;
  el.disabled = false;
  el.textContent = el.dataset.originalText || el.textContent;
}

/* ── Order status badge ──────────────────────────────────── */
function statusBadge(status) {
  const map = {
    pending:   ['#e0a952', 'Pending'],
    paid:      ['#5ec789', 'Paid'],
    shipped:   ['#4ea8e0', 'Shipped'],
    delivered: ['#5ec789', 'Delivered'],
    cancelled: ['#e05252', 'Cancelled'],
    refunded:  ['#888', 'Refunded'],
  };
  const [color, label] = map[status] || ['#888', capitalize(status)];
  const el = document.createElement('span');
  el.style.cssText = `
    display:inline-block;padding:3px 10px;border-radius:20px;
    font-size:12px;font-weight:600;letter-spacing:0.5px;
    background:${color}22;color:${color};border:1px solid ${color}55;
  `;
  el.textContent = label;
  return el;
}
