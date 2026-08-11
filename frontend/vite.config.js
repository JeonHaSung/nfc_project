import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function apiOnlyProxy(target) {
  return {
    target,
    bypass(req) {
      // HTML 네비게이션은 React SPA가 처리, API만 백엔드로
      const accept = req.headers.accept || ''
      if (req.method === 'GET' && accept.includes('text/html')) {
        return '/index.html'
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    open: true,
    port: 3000,
    proxy: {
      '/management': 'http://localhost:8080',
      '/tag': apiOnlyProxy('http://localhost:8080'),
      '/onboarding': apiOnlyProxy('http://localhost:8080'),
    },
  },
  plugins: [react()],
})
