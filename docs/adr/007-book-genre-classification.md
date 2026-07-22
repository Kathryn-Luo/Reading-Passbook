# ADR-007: 書籍類型(genre)分類機制

- 狀態：已接受
- 日期：2026-07-22
- 相關：spec §3.1（books 表）、§4（衍生值：類型廣度）、§5（等級系統：類型廣度訊號）、§10（前端/架構對應）
- 前置決策：kind / status 使用 `text + CHECK`（既有慣例）；「會變的規則放進資料，不寫死在 schema」（等級門檻、勳章規則之 data-driven 原則）


---

## Context（背景）

新增的三個功能都依賴「書籍類型（genre）」，但目前 `books` 表沒有分類欄位：

1. 書櫃頁：依類型分區、篩選
2. 統計頁：類型分布圖（見 review 畫面的「類型分布」）
3. 等級系統：「類型廣度」訊號需算 distinct 類型數，作為升級的客觀訊號之一，且需防重讀/髒資料灌水

限制條件：
- 加書透過 `/api/books` 代理 Google Books API，回傳的 `categories` 是自由英文字串（Fiction、Self-Help...），數量多、粒度不一，且對不上本專案想要的中文類型桶
- 目標桶為固定少量的中文類型（文學小說/心理勵志/歷史/科普/其他⋯⋯），上線後預期會增減、改名
- 「類型廣度」餵入等級系統，distinct 計算的「確定性與可信度」是硬需求，不是顯示用的 nice-to-have

核心張力：
genre 清單「會變」，性質接近等級門檻/勳章規則（展示型、上線後會調），而非 kind / status （系統行為契約、幾乎不變）。因此 genre 的處理方式應向「資料驅動」靠攏，而非釘進 schema。


---

## Decision（決策）

採用「獨立參照表 + 外鍵（FK）」：
- 新增 `genres` 參照表，作為類型桶清單的單一真相來源
- `books` 新增 `genre_id`，以 FK 參照 `genres`
- 加書時類型由「使用者手動單選」；不在第一版導入 AI 自動對應
- 書櫃分區、統計圖類別軸、加書下拉選單等所有類型清單一律從 `genres` 表讀取，前端不寫死中文字串

配套的附帶決策見下方「附帶決策」節

---

## Options considered （評估選項）

以四個維度評估：類型清單增減改名、 distinct 廣度計算、加書流程、額外複雜度 / 原則相符度

### 選項一：自由文字（`genre text`，無約束）
- 清單增減改名：schema 不管，改名需全表 UPDATE，無防呆，同義異寫（科普/科普類/科學普及）會共存且難察覺
- distinct 廣度：`COUNT(DISTINCT genre)` 可跑，但髒資料會使廣度失真、灌水。與硬需求衝突
- 加書流程：最省事
- 複雜度/原則：零表，但計算基礎不可信。淘汰

### 選項二：Postgres enum type
- 清單增減改名：加值需 `ALTER TYPE ... ADD VALUE`(不可於 transaction block)；改名需PG10+；刪值不支援，須重建 type。每次調整都是一條 DDL migration（append-only、進 git，成本重）
- distinct 廣度：受控，乾淨
- 加書流程：需字串對映
- 複雜度／原則：零表，但把「會變的清單」編碼進型別系統，違反 data-driven 原則。淘汰。

### 選項三：`text + CHECK`（與 kind / status 一致）
- 清單增減改名：改清單 = DROP/ADD CONSTRAINT，一條 migration。比 enum 好操作，但清單仍寫在 schema DDL。
- distinct 廣度：受控，乾淨。
- 加書流程：需字串對映。
- 複雜度／原則：零表、風格與既有欄位一致、認知負擔低。但「清單在 DDL 不在 data」的哲學問題仍在（較 enum 輕）。次佳。

> 註：text+CHECK 用於 kind / status 是正確的，因其為系統行為契約、幾乎不變。genre 性質不同（會被使用者感知、上線後會調），較不適用。

### 選項四：獨立參照表 + FK（採用）
- 清單增減改名：改名 = `UPDATE genres`，一筆資料操作、零 migration，引用該類型的書自動跟隨（書存 id 不存字串）。新增 = INSERT。純資料操作，符合 data-driven 原則。
- distinct 廣度：`COUNT(DISTINCT genre_id)`，FK 保證合法，最乾淨。
- 加書流程：最重——需將 Google Books 字串對映到 genre_id，多一次 lookup。第一版以手選處理。
- 複雜度／原則：多一表一 FK；但該表同時是全 app 類型清單的單一真相來源。符合原則，採用。


### 四維對照
 
| 維度 | 自由文字 | enum | text+CHECK | 參照表+FK |
|---|---|---|---|---|
| 清單增減改名 | 全表 UPDATE、無防呆 | DDL、刪值不支援 | DDL、可改但仍在 schema | 一筆 UPDATE、純資料 |
| distinct 廣度 | 會被髒資料灌水 | 乾淨 | 乾淨 | 最乾淨（FK 保證） |
| 加書流程 | 最省事 | 需對映 | 需對映 | 需對映 + lookup |
| 額外複雜度 | 零 | 零 | 零、風格一致 | 多一表一 FK |
| 符合 data-driven 原則 | ✗ | ✗ | △ | ✓ |


---
 
## 附帶決策（Sub-decisions）
 
### A. `genre_id` FK 的 on delete 行為
 
`genres` 是本專案控制的參照資料，非使用者資料。使用者不刪類型；僅維運時可能淘汰桶。
 
- 採 `ON DELETE RESTRICT`：只要仍有書引用該 genre，即禁止刪除，資料庫層保證不出現「孤兒書」。淘汰一個桶前須先把書搬走（改分類）。
- 排除 `CASCADE`（會連帶刪書，災難性）與 `SET NULL`（book 變無類型，各處需處理 null 分支）。
- 搭配 `genres.is_active boolean` 做軟停用：停用的類型不再出現在加書選單，但既有書與歷史統計不受影響。「類型清單的減」成為純資料操作（`UPDATE ... SET is_active = false`），零 migration，與 deposits「軟刪不硬刪」哲學一致。
### B. `books.genre_id` 的 nullability
 
- 採 `NOT NULL`，以「其他」作為保底桶。加書流程強制選類型；廣度計算不需處理 null 分支。
### C. Google Books category 對應策略（第一版）
 
- 第一版不做自動對映：不將 Google 的 `categories` 寫入 `genre_id`。
- 加書 UI 將 Google 回傳的 categories 當提示顯示（例：「Google 分類：Fiction / Literary」），輔助使用者判斷該選哪個桶，屬零成本引導，非 AI。
- Google 常回多個 categories，而本桶為單選——收斂點落在使用者，由使用者選定唯一 genre。
### D. 加書時類型選擇 UI（手選版）
 
- 受控單選，選項一律從 `genres` 表讀取（`is_active = true`），前端不寫死中文字串。
- 「其他」恆置末、當保底，對應 `NOT NULL` 的出口。
- 沿用既有 chip／下拉樣式（color.png 之已選／未選狀態），不新增元件。
### E. `genres` 的 RLS

`genres` 是專案控制的參照資料、非使用者資料，權限模型與 `books`（使用者資料）不同：

- **SELECT 對所有人開放（含 `anon`）**：公開閱讀主頁與書櫃分區要顯示類型名稱，匿名讀 `books` 時會 join `genres` 取名。若不開放，預設會擋掉全部 SELECT，公開頁的分區名稱會讀不到。此決策把「`genres` 必須公開可讀」固定為架構約束。
- **INSERT / UPDATE / DELETE 不開放給一般使用者**：類型桶的增／改名／停用屬維運行為，只由 service role（或後台）執行。一般登入者即使能讀，也不得寫。這與 A 節「使用者不刪類型、僅維運時淘汰桶」一致——A 節是 FK 的 `ON DELETE` 行為，本節則以 RLS policy 在存取層落實同一原則。
- `books.genre_id` 只是欄位，沿用 `books` 既有 RLS 即可，不需為它額外開 policy。

policy 形狀（示意，非最終 SQL）：

```sql
alter table genres enable row level security;

-- 所有人（含匿名）可讀
create policy "genres are readable by everyone"
  on genres for select
  using (true);

-- 不建立任何 INSERT/UPDATE/DELETE policy
-- → 一般 client（anon/authenticated）一律無法寫，
--   維運改動走 service role（繞過 RLS）
```
---
 
## Consequences（後果）
 
### 正面
- `類型廣度` distinct 計算建立在 FK 保證的乾淨資料上，可信、可防灌水，滿足等級系統的硬需求。
- 類型清單（增／改名／停用）成為純資料操作，符合 data-driven 原則，日後調整零 migration。
- `genres` 表為全 app 類型清單的單一真相來源；書櫃分區、統計軸、加書選單自動同步。
### 負面／成本
- 加書流程新增一次 genre 選擇（手選）與 lookup，較其他方案重。
- 手選把分類品質交給使用者當下判斷，同類書可能被歸入不同桶。對廣度影響輕微（distinct 桶數偶有少算，不致灌水），可接受。
- 多一張表與一個 FK 的維護成本。
### Future work（後續，不在本 ADR 範圍）
- AI 對映：以「三段式 fallback」補上加書體驗：
  1. 查對映表命中即完成；
  2. 落空時 AI 分類一次、限定輸出於合法桶，僅當 UI 預設值；
  3. 使用者最終確認／覆寫。使用者確認結果回寫對映表，使表「越用越聰明」，AI 退居長尾冷啟動填充器。此為體驗優化，非功能必需，故第一版不做。
- 歷史廣度快照：是否於首次讀完當下記錄 genre_id，避免日後類型改名影響歷史廣度計算。牽動「衍生值從流水算」原則（廣度是否應為可回溯快照），另立 ADR 評估。