import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function deferEntryStylesheet() {
  return {
    name: 'luviio-defer-entry-stylesheet',
    apply: 'build',
    closeBundle() {
      const outputPath = resolve(process.cwd(), 'dist/index.html')
      let html = readFileSync(outputPath, 'utf8')
      let converted = 0

      // Vite injects the app's hashed CSS link into the production HTML.
      // Preload it without blocking first paint; the inline critical CSS in
      // index.html keeps the storefront header and hero stable while it loads.
      html = html.replace(
        /<link\\b(?=[^>]*\\brel=["']stylesheet["'])[^>]*\\bhref=["']([^"']+\\.css)["'][^>]*>/gi,
        (tag, href) => {
          if (!href.startsWith('/assets/')) return tag
          converted += 1
          return `<link rel="preload" as="style" href="${href}" fetchpriority="high" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript>`
        },
      )

      if (converted === 0) {
        throw new Error('[Luviio] Could not find Vite entry stylesheet in dist/index.html')
      }

      writeFileSync(outputPath, html)
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
