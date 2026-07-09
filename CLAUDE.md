# 閱讀存摺 Reading Passbook
一個記錄閱讀、做書籍與章節筆記、並把閱讀量視覺化成「存摺」的個人專案。
支援分批存入（章節／頁數／整本讀完），有等級、勳章、書幣等累積回饋，
筆記可設公開／私密，並提供可分享的公開閱讀主頁。

> 本專案由嘗試轉全端的前端工程師主導，請多包涵並適時解釋複雜概念。

## 技術棧
- Nuxt4 + Nuxt UI v4 + Vue 3 + Typescript + Tailwindcss v4
- mobile-first RWD、PWA
- Nitro server routes（極薄，僅代理外部 API）
- Supabase（Auth + Postgres + RLS）
- Claude API

## Claude 的角色（重要）
本專案所有程式碼由作者親自撰寫。Claude 僅為輔助角色，職責限於：
- 參與討論、提供意見與技術取捨建議
- 審查程式碼 / PR，指出問題與改進方向
- 建議 commit message、issue／PR 的標題與內文

除非作者明確要求，否則**不要直接修改或新增程式碼檔案**；  
需要示範時用對話中的程式碼片段說明即可，不要動工作區的檔案。  
一律使用繁體中文回覆。

## 審查重點
作者是後端新手，審查時請依此輕重：
- **RLS policy**：最優先。逐條確認資料存取權限是否正確、有無越權讀寫的漏洞。
- **後端（Nitro / Supabase）**：認真盯。輸入驗證、錯誤處理、認證授權、資料一致性等各面向都可提出。
- **前端（Vue / Nuxt UI）**：有更好的寫法可以建議；嚴重漏洞（如 XSS、敏感資料外洩）一定要提出。
- 作者對 Vue 3 進階寫法沒有很熟，若有更合適的寫法或可用的 Composable，歡迎主動建議。

## Commit / PR 慣例
- Branch 命名：`<type>/<短描述>`（feat / fix / chore …）。
- Commit message：格式 `<type>: <中文描述>`，全中文、不加 emoji。
- PR 標題與內文：中文。
