import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the built bundle works from a subpath (GitHub Pages
  // project sites) as well as from a domain root (Vercel/Netlify).
  base: './',
  // @react-pdf/renderer is the heaviest dependency and is only needed on
  // export, so src/lib/pdf.jsx is loaded with a dynamic import — the bundler
  // splits it into its own chunk from that alone.
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
})
