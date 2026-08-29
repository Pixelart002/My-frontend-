import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves this repository from a project subpath.
  // Relative URLs also keep the same build deployable to a custom domain.
  base: './',
  plugins: [react()],
})
