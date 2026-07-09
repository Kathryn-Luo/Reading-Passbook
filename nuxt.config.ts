// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  typescript: {
    typeCheck: true,
  },
  modules: ['@nuxt/ui', '@nuxt/eslint', '@nuxtjs/supabase'],
  eslint: {
    config: {
      stylistic: true,
      autoInit: false
    }
  },
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',   // OAuth 回跳頁
      exclude: ['/'],         // 首頁不強制登入，其餘預設保護
    }
  },
})