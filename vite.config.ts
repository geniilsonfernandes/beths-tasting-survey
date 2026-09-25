import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-beths.svg', 'products/*'],
      workbox: { globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,webp,svg}'] },
      manifest: {
        name: "Beth's Product Tasting",
        short_name: 'Beth’s Tasting',
        description: "Beth's product tasting survey",
        theme_color: '#F8C300',
        background_color: '#FBF8EE',
        display: 'fullscreen',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
    }),
  ],
})
