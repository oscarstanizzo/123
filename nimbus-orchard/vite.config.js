import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  // Inline the illustrations so dist/artifact.html stays a single file.
  build: { assetsInlineLimit: 4 * 1024 * 1024 },
})
