import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vercel hosts at root (providerpulse.vercel.app or custom domain), so base is '/'.
// Default outDir 'dist' is what Vercel auto-detects — no extra config needed.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
