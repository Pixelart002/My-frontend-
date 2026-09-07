import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
  // Vercel serves the SPA from the domain root; absolute asset URLs keep
  // assets working when a deep React Router route is refreshed directly.
    base: '/',
    plugins: [react()],
    define: {
      'import.meta.env.NEXT_PUBLIC_API_URL': JSON.stringify(env.NEXT_PUBLIC_API_URL || ''),
      'import.meta.env.STRIPE_PK': JSON.stringify(env.STRIPE_PK || ''),
    },
  }
})
