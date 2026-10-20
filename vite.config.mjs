import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function deferEntryStylesheet() {
  return {
    name: 'luviio-defer-entry-stylesheet',
    apply: 'build',
    transformIndexHtml: {
      // Run after Vite has injected the hashed entry stylesheet and script.
      // This avoids relying on output-bundle hook ordering, which changed in Vite 8.
      order: 'post',
      handler(html) {
        let converted = 0

        html = html.replace(
          /<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*\bhref=["']([^"']+\.css)["'][^>]*>/gi,
          (tag, href) => {
            if (!href.startsWith('/assets/')) return tag
            converted += 1
            return `<link rel="preload" as="style" href="${href}" fetchpriority="high" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript>`
          },
        )

        if (converted === 0) {
          throw new Error('[Luviio] Could not find Vite entry stylesheet in transformed index.html')
        }

        // Preload the hashed entry module to begin the SPA bootstrap earlier.
        const entryScript = html.match(
          /<script\b(?=[^>]*\btype=["']module["'])[^>]*\bsrc=["'](\/assets\/[^"']+\.js)["'][^>]*>\s*<\/script>/i,
        )
        if (entryScript && !html.includes(`rel="modulepreload" href="${entryScript[1]}"`)) {
          html = html.replace(
            '</head>',
            `    <link rel="modulepreload" href="${entryScript[1]}" fetchpriority="high" crossorigin />\n  </head>`,
          )
        }

        return html
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // Vercel serves the SPA from the domain root; absolute asset URLs keep
    // assets working when a deep React Router route is refreshed directly.
    base: '/',
    plugins: [react(), deferEntryStylesheet()],
    define: {
      'import.meta.env.NEXT_PUBLIC_API_URL': JSON.stringify(env.NEXT_PUBLIC_API_URL || ''),
      'import.meta.env.STRIPE_PK': JSON.stringify(env.STRIPE_PK || ''),
    },
  }
})
