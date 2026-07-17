// 登入成功後，把使用者導向回原本語言的首頁
// login.vue（已登入時）與 confirm.vue（OAuth 登入後）共用同一套邏輯
export function useLoginRedirect() {
  const user = useSupabaseUser()
  const localePath = useLocalePath()
  const nuxtApp = useNuxtApp()

  watch(user, async () => {
    if (!user.value) return

    // 導向至原本語言的首頁
    await nuxtApp.runWithContext(() => navigateTo(localePath('index')))
  }, { immediate: true })
}
