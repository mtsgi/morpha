// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',
  devtools: { enabled: true },
  css: ['~/assets/scss/main.scss'],
  modules: ['@pinia/nuxt'],

  // GitHub Pages SPA deployment
  // ssr: false is only applied in CI (when NUXT_APP_BASE_URL is set) to avoid
  // the "Vite Node IPC socket path not configured" error in nuxt dev.
  ssr: process.env.NUXT_APP_BASE_URL !== undefined ? false : undefined,
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL ?? '/',
  },
})
