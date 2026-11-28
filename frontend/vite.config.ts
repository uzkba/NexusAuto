import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    fs: { allow: [".."] },
    proxy: { '/api': { target: 'http://localhost:8000', rewrite: (p) => p.replace(/^\/api/, '') } },
  },
  test: { environment: 'jsdom', globals: true },
})