import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins:[react(),VitePWA({
    registerType:'autoUpdate',
    includeAssets:['icon.svg','push-worker.js'],
    workbox:{
      importScripts:['/push-worker.js'],
      globPatterns:['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      // Phones cache only their own background; desktop variant is cached on demand.
      globIgnores:['**/cosmos-v1.webp','**/cosmos-v2-desktop.webp'],
      runtimeCaching:[{
        urlPattern:/\/assets\/cosmos-v2-desktop\.webp$/,
        handler:'CacheFirst',
        options:{cacheName:'start-cosmos-images-v2',expiration:{maxEntries:2,maxAgeSeconds:2592000},cacheableResponse:{statuses:[200]}},
      }],
    },
    manifest:{
      name:'START — начни с пяти минут',short_name:'START',description:'Пять минут, чтобы начать.',
      theme_color:'#09090b',background_color:'#09090b',display:'standalone',orientation:'portrait',start_url:'/',
      icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}],
    },
  })],
})
