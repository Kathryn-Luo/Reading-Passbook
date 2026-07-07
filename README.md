# 閱讀存摺 Reading Passbook

> 把讀過的書像存款一樣，一筆一筆存進存摺，累積成你的閱讀資產。

一個記錄閱讀、做書籍與章節筆記、並把閱讀量視覺化成「存摺」的個人專案。
支援分批存入（章節／頁數／整本讀完），有等級、勳章、書幣等累積回饋，
筆記可設公開／私密，並提供可分享的公開閱讀主頁。

這是我三年前用 **Nuxt 3 + Firebase** 寫過的個人 side project，現以
**Nuxt 4 + Supabase** 全新重寫——重構資料模型（以「存入流水」為單一真相）、
把權限下沉到資料庫層（RLS），並補上原本沒做的累積機制與社群頁。
舊版見 [read-passbook](https://github.com/Kathryn-Luo/read-passbook)（已封存）。

技術決策記錄於 [`docs/adr/`](docs/adr/)。

## 技術棧
- **前端**：Nuxt 4（app/ 結構）、mobile-first RWD、PWA
- **後端**：Supabase（Auth + Postgres + RLS），Nitro server routes（極薄，僅代理外部 API）
- **AI**：Claude API 生成閱讀筆記摘要

## 為什麼重寫
簡述於此，完整權衡見 [ADR-000](docs/adr/000-rewrite-from-scratch.md)。