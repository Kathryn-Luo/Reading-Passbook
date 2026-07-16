// i18n × Supabase 的路由單一事實來源。
// 加語言只改 locales; 加公開頁只改 publicPaths,exclude 會自動衍生。

export const defaultLocale = 'zh-TW'
export const locales = [
  { code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
  { code: defaultLocale, language: 'zh-TW', file: 'zh-TW.json', name: '繁體中文' },
]

// 免登入的公開頁面（只列「不含語言前綴」的原始路徑）
export const publicPaths = ['/']

// 自動組出每個非預設語言的前綴版本 → 給 Supabase redirectOptions.exclude
const prefixedLocales = locales
  .map(l => l.code)
  .filter(code => code !== defaultLocale)

export const excludePaths = publicPaths.flatMap(path => [
  path,
  ...prefixedLocales.map(code =>
    path === '/' ? `/${code}` : `/${code}${path}`,
  ),
])
