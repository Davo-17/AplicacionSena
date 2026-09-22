import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // El backend sirve lo construido en /admin (ver backend/app/main.py).
  base: '/admin/',
  plugins: [react(), tailwindcss()],
})
