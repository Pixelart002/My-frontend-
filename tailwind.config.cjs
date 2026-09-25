/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        gold: 'var(--gold, #d8ad6a)',
        'gold-soft': 'var(--gold-soft, #f0cf97)',
        'gold-dim': 'var(--gold-dim, rgba(216,173,106,.12))',
        surface: 'var(--surface, #1b1917)',
        'surface-2': 'var(--surface-2, #24211e)',
        line: 'var(--line, #3a3530)',
        text: 'var(--text, #f5efe7)',
        muted: 'var(--muted, #a59b91)',
        dim: 'var(--dim, #6d655c)',
        success: 'var(--success, #6fbf8a)',
        'success-dim': 'var(--success-dim, rgba(111,191,138,.12))',
        danger: 'var(--danger, #e0735f)',
        'danger-dim': 'var(--danger-dim, rgba(224,115,95,.12))',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'luviio-card': '0 18px 44px rgba(0, 0, 0, .18)',
        'luviio-image': '0 10px 30px rgba(0, 0, 0, .16)',
      },
    },
  },
  plugins: [],
};
