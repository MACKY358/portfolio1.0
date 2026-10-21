import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the site works when served from a subpath such as
  // https://<user>.github.io/portfolio1.0/ as well as from a domain root.
  base: './',
  plugins: [react()],
})
