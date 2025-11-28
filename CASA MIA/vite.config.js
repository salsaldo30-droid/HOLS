import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'assets/apple-touch-icon.png', 'assets/pwa-192x192.png', 'assets/pwa-512x512.png'],
      manifest: {
        name: 'CASA MIA',
        short_name: 'CASA MIA',
        description: 'Aplicación de gestión de restaurante CASA MIA',
        theme_color: '#8B4513',
        icons: [
          {
            src: 'assets/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'assets/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'assets/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'src/features/admin/index.html'),
        cajero: resolve(__dirname, 'src/features/cajero/index.html'),
        cocina: resolve(__dirname, 'src/features/cocinero/index.html'),
        mesero: resolve(__dirname, 'src/features/mesero/index.html'),
      },
    },
  },
});
