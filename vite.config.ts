import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: '/Destreza/',
  plugins: [preact(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
    manifest: {
      id: '/Destreza/', name: 'Destreza', short_name: 'Destreza', lang: 'pt-BR',
      description: 'Devagar, o gesto aprende.', start_url: '/Destreza/', scope: '/Destreza/',
      display: 'standalone', background_color: '#f6f3eb', theme_color: '#173f35',
      icons: [{src:'icon-192.png',sizes:'192x192',type:'image/png'}, {src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'], navigateFallback: 'index.html', cleanupOutdatedCaches: true },
  })],
  test: { include: ['tests/**/*.test.ts'], setupFiles: ['fake-indexeddb/auto'] },
});
