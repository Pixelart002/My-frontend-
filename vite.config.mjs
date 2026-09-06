import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Vercel serves the SPA from the domain root; absolute asset URLs keep
  // assets working when a deep React Router route is refreshed directly.
  base: '/',
  plugins: [react()],
})
