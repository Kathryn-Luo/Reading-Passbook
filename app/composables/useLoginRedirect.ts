// 登入成功後，把使用者導向回原本語言的首頁
// login.vue（已登入時）與 confirm.vue（OAuth 登入後）共用同一套邏輯
export function useLoginRedirect() {
  const user = useSupabaseUser()
  const localePath = useLocalePath()
  const { setLocale, locales } = useI18n()

  // OAuth 是整頁跳轉，記憶體狀態會清空，語言只能靠 cookie 存活。
  // i18n_redirected 是 detectBrowserLanguage 用來記住語言的 cookie。
  const savedLocale = useCookie('i18n_redirected')

  watch(user, async () => {
    if (!user.value) return

    // cookie 是字串（可能會被更改或是舊值），拿實際 locales 過濾一次
    // 同時完成「型別窄化成 'en' | 'zh-TW' | ...」與「執行期驗證」，找不到就回 undefined。
    const codes = locales.value.map(l => l.code)
    const locale = codes.find(c => c === savedLocale.value)

    // 把語言設定回來
    if (locale) {
      await setLocale(locale)
    }
    // 導向至原本語言的首頁
    await navigateTo(localePath('index', locale))
  }, { immediate: true })
}
