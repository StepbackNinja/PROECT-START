import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({ plugins: [react(), VitePWA({ registerType: 'autoUpdate', includeAssets: ['icon.svg'], manifest: { name: 'START — начни с пяти минут', short_name: 'START', description: 'Пять минут, чтобы начать.', theme_color: '#09090b', background_color: '#09090b', display: 'standalone', orientation: 'portrait', start_url: '/', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }] } })] })
