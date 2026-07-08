// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  typescript: {
    typeCheck: true,
  },
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint'
  ],
  eslint: {
    config: {
      stylistic: true,
      autoInit: false
    }
  }
})