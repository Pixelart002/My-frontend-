import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function deferEntryStylesheet() {
  return {
    name: 'luviio-defer-entry-stylesheet',
    apply: 'build',
    // Run after Vite's internal build plugins have generated the HTML asset.
    enforce: 'post',
    generateBundle(_outputOptions, bundle) {
      const htmlAsset = bundle['index.html']

      if (!htmlAsset || htmlAsset.type !== 'asset') {
        this.error('[Luviio] Vite did not emit index.html; cannot defer the entry stylesheet.')
      }

      let html =
        typeof htmlAsset.source === 'string'
          ? htmlAsset.source
          : new TextDecoder().decode(htmlAsset.source)
      let converted = 0

      // Modify the generated HTML asset in-place instead of reading dist/index.html
      // from closeBundle(), where Vite 8/Rolldown may not have written it yet.
      html = html.replace(
        /<link\\b(?=[^>]*\\brel=["']stylesheet["'])[^>]*\\bhref=["']([^"']+\\.css)["'][^>]*>/gi,
        (tag, href) => {
          if (!href.startsWith('/assets/')) return tag
          converted += 1
          return `<link rel="preload" as="style" href="${href}" fetchpriority="high" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript>`
        },
      )

      if (converted === 0) {
        this.error('[Luviio] Could not find Vite entry stylesheet in generated index.html')
      }

      // Discover the hashed entry module at build time and preload it from
      // <head>. This starts the single-page-app bootstrap early without a fixed hash.
      const entryScript = html.match(
        /<script\\b(?=[^>]*\\btype=["']module["'])[^>]*\\bsrc=["'](\\/assets\\/[^"']+\\.js)["'][^>]*>\\s*<\\/script>/i,
      )
      if (entryScript && !html.includes(`rel="modulepreload" href="${entryScript[1]}"`)) {
        html = html.replace(
          '</head>',
          `    <link rel="modulepreload" href="${entryScript[1]}" fetchpriority="high" crossorigin />\\n  </head>`,
        )
      }

      htmlAsset.source = html
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
