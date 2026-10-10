import { defineConfig } from 'vite'

export default defineConfig({
  // Relative paths: the same dist/ works on GitHub Pages, Netlify, Vercel.
  base: './',
  build: {
    target: 'esnext'
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  }
})
