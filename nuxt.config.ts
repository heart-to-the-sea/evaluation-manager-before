import { presetIcons, presetUno, transformerDirectives, transformerVariantGroup } from 'unocss';
import { fileURLToPath } from 'node:url';

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  ssr: false,
  srcDir: 'src/',
  css: [
    '@/assets/styles/css/reset.css',
    '@/assets/styles/css/transition.css',
    '@/assets/styles/css/global.css',
    '@/assets/styles/scss/scrollbar.scss',
    '@/assets/styles/scss/global.scss'
  ],
  modules: ['@pinia/nuxt', '@unocss/nuxt'],
  runtimeConfig: {
    public: {
      appName: '评估管理系统',
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/em'
    }
  },
  imports: {
    dirs: ['stores', 'composables', 'utils']
  },
  app: {
    head: {
      title: '评估管理系统',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    }
  },
  vite: {
    resolve: {
      alias: {
        '#app-manifest': fileURLToPath(new URL('./app-manifest.json', import.meta.url))
      }
    },
    server: {
      proxy: {
        '/em': {
          target: 'http://127.0.0.1:9990',
          changeOrigin: true
        }
      }
    }
  },
  unocss: {
    presets: [presetUno(), presetIcons()],
    transformers: [transformerDirectives(), transformerVariantGroup()]
  },
  typescript: {
    strict: true,
    typeCheck: false
  }
});
