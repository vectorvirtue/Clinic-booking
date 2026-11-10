import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/reset': 'http://localhost:3001',
      '/slots': 'http://localhost:3001',
      '/bookings': 'http://localhost:3001',
    },
  },
})
