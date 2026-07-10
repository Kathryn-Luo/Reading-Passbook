// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxtjs/supabase',
  ],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',
  typescript: {
    typeCheck: true,
  },
  eslint: {
    config: {
      stylistic: true,
      autoInit: false,
    },
  },
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm', // OAuth 回跳頁
      exclude: ['/'], // 首頁不強制登入，其餘預設保護
    },
  },
})
