import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    open: true,
    port: 3000,
    proxy: {
      '/management': 'http://localhost:8080',
      '/tag': 'http://localhost:8080',
      '/onboarding': 'http://localhost:8080',
    },
  },
  plugins: [react()],
})
