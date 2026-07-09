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
      callback: '/confirm',
      exclude: ['/*'],  // TODO: 開發期全放行,等登入流程做好再收回來
    }
  }
})