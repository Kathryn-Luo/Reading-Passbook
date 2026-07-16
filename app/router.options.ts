import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  async scrollBehavior(to, from, savedPosition) {
    const nuxtApp = useNuxtApp()

    // 確保路由已切換
    if (nuxtApp.$i18n && to.name !== from.name) {
      // `$i18n` 是在 nuxtjs/i18n 模組的 `setup` 中注入的。
      // `scrollBehavior` 會被防護，避免在未完成時被呼叫
      await nuxtApp.$i18n.waitForPendingLocaleChange()
    }
    // 滾動到頂部
    return savedPosition || { top: 0 }
  },
}
