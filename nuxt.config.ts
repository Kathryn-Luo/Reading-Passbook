import { defaultLocale, locales, excludePaths } from './config/routing'

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxtjs/supabase',
    '@nuxtjs/i18n',
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
  fonts: {
    families: [
      { name: 'Noto Serif TC', provider: 'google', weights: [400, 700, 900] },
      { name: 'Noto Sans TC', provider: 'google', weights: [400, 500, 700] },
    ],
  },
  i18n: {
    defaultLocale,
    locales,
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'no prefix',
    },
  },
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm', // OAuth 回跳頁
      exclude: excludePaths, // 首頁不強制登入，其餘預設保護
    },
  },
})
