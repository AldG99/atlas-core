import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
  },
  build: {
    rollupOptions: {
      output: {
        // Separa los vendors pesados del código de la app: se cargan igual
        // en el arranque (Auth/Firestore se necesitan antes de rutear), pero
        // quedan en chunks propios que el navegador cachea entre despliegues
        // donde solo cambia el código de la app, no las dependencias.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('firebase') || id.includes('@firebase')) return 'vendor-firebase';
          // Todo el ecosistema de React debe ir junto: separarlo (ej. scheduler
          // o use-sync-external-store cayendo en el chunk genérico) rompe el
          // orden de inicialización entre chunks y causa "x is undefined" en runtime.
          if (
            id.includes('react-router') ||
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/scheduler/') ||
            id.includes('/react-is/') ||
            id.includes('/use-sync-external-store/')
          ) return 'vendor-react';
          if (id.includes('i18next')) return 'vendor-i18n';
          if (id.includes('@dicebear')) return 'vendor-dicebear';
          if (id.includes('react-icons') || id.includes('lucide-react')) return 'vendor-icons';
          return 'vendor';
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['favicon.svg', 'logo-skytla.svg'],
      manifest: {
        name: 'Skytla — Gestor de Pedidos',
        short_name: 'Skytla',
        description: 'Diseñado para gestionar tus pedidos. Construido para escalar tu negocio.',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/dashboard',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache' },
          },
        ],
      },
    }),
  ],
})
