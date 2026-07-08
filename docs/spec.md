# 閱讀存摺 (Reading Passbook) — 產品規格與資料模型

| | |
|---|---|
| **狀態** | Draft — 核心產品決策已收斂 |
| **版本** | v1.0 |
| **最後更新** | 2026-07-08 |
| **技術棧** | Nuxt 4 (`app/`, PWA) + Nitro server routes（極薄）+ Supabase (Auth + Postgres + RLS) |
| **範圍** | 資料模型、衍生值計算、等級/書幣/勳章、權限、前端對應、實作順序 |

> **核心原則**：一張設計良好的「存入流水表」(`deposits`) 是整個產品的心臟，其餘數值全部從它算出來。

---

## 目錄

- [0. 一句話定義](#0-一句話定義)
- [1. 核心設計原則](#1-核心設計原則決定資料模型的三條鐵律)
- [2. 實體總覽](#2-實體總覽)
- [3. 資料表定義](#3-資料表定義)
- [4. 衍生值計算](#4-衍生值怎麼算不是表是查詢計算邏輯)
- [5. 等級系統](#5-等級系統經驗值--等級)
- [6. 書幣系統](#6-書幣系統)
- [7. 勳章系統](#7-勳章系統)
- [8. 效能策略](#8-效能先簡單慢了再快取)
- [9. 權限 (RLS)](#9-權限supabase-rls把授權下沉到-db)
- [10. 前端 / 架構對應](#10-前端--架構對應)
- [11.「留門」清單](#11留門清單現在做-web未來長成-app-不用重寫)
- [12. 建議實作順序](#12-建議實作順序單人開發每階段都有可展示成果)

---

## 0. 一句話定義

把讀過的書像存款一樣「一筆一筆」存進存摺。餘額只增不減，累積成你的閱讀資產。
支援分批存入（章節 / 頁數 / 整本讀完），有等級、勳章、書幣三種累積回饋，可設定公開/私密並在公開頁展示身份。

---

## 1. 核心設計原則（決定資料模型的三條鐵律）

1. **一切從流水算，不存快照。**
   餘額、累積本數、累積頁數、書幣、經驗值、等級、勳章進度 —— 全部是從 `deposits`（存入流水）**推導**出來的衍生值，不直接存一個 `total` 欄位去手動加減。
   > 為什麼：分批存入、刪除沖正、重讀去重這三個功能，只要有一個地方直接改 total，帳就會對不起來。從流水算是唯一能保證一致性的做法。
   > 效能：真的慢了再加「物化快照」當快取（見 §8），但快取永遠可以從流水重算，流水是唯一真相 (single source of truth)。

2. **「本數」計算的是「讀過幾本不同的書」（廣度），不是「讀完幾次」（次數）。**
   一本書一生只在「首次讀完」時 +1 本、發一次首讀書幣。重讀不再加本數、不再發首讀書幣，但會記錄行為、可累積閱讀天數/頁數、可觸發重讀勳章。

3. **刪除是「沖正」不是「消失」。**
   使用者體驗上有「刪除/編輯」，底層是軟刪除 + 反向調整分錄，保留完整可稽核歷史。已發出的書幣/勳章跟著回沖。

---

## 2. 實體總覽

```
users (Supabase auth.users 延伸)
  └─ books            使用者的書（書目 + 這本書的閱讀狀態）
       └─ deposits    ★ 存入流水（心臟）— 每次存入一筆
       └─ notes       筆記（書 / 章節層級，可公開私密）
  └─ goals            年度/月目標（撲滿型累積）
  └─ follows          追蹤關係（社群）
  └─ reactions        讚（社群）
  └─ comments         留言（社群）
  └─ (衍生) wallet / level / badges  ← 不是表，是從 deposits 算出來的
```

> 註：`wallet`、`level`、`badges` 標為衍生，第一版可以是「查詢時即時計算」或「物化快取表」。先做即時計算，簡單且不會出錯。

---

## 3. 資料表定義

### 3.1 `books` — 書 + 閱讀狀態

一本書是一個「儲蓄帳戶」，你持續往裡面存，直到讀完。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | 擁有者 |
| title | text | 書名 |
| author | text | 作者 |
| isbn | text null | 用於外部 API 查詢 |
| total_pages | int null | 總頁數（用於進度計算；可空，手動輸入書可能沒有） |
| cover_url | text null | 封面 |
| source | text | 資料來源：`google_books` / `manual` / (未來) `other` |
| status | text | `reading` / `finished`。**衍生自 deposits，但存一份方便查詢與 RLS**；由 deposits 觸發更新 |
| first_finished_at | timestamptz null | 首次讀完時間。**null = 從未讀完**。用於「本數」去重的關鍵 |
| visibility | text | `public` / `private`，預設 `private` |
| created_at | timestamptz | |

> `first_finished_at` 是「本數只算一次」的關鍵：一旦被設定過就不再變動，重讀不會覆寫它。

### 3.2 `deposits` — ★ 存入流水（整個系統的心臟）

每一次「存入存摺」的動作 = 一筆 deposit。首頁的存摺明細 = 這張表的呈現。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| book_id | uuid FK → books | |
| kind | text | 存入類型，見下方列舉 |
| pages_delta | int | 這筆存入貢獻的頁數（首讀進度為正；沖正為負） |
| chapter_label | text null | 若為章節存入，記章節名（「第七章・有慶之死」） |
| to_page | int null | 若為「存入到第 N 頁」，記當下讀到的頁碼 |
| coins_delta | int | 這筆發放/回沖的書幣（可負） |
| exp_delta | int | 這筆發放/回沖的經驗值（可負） |
| counts_as_book | boolean | 這筆是否讓「本數 +1」。**整個系統只有 kind=`finish_first` 時為 true** |
| reverses_deposit_id | uuid null | 若這是沖正分錄，指向被沖正的原 deposit |
| is_voided | boolean | 這筆是否已被沖正（軟刪除標記） |
| created_at | timestamptz | 存入時間（帳列日期） |

**`kind` 列舉：**
- `progress_pages` — 首讀期間存入一段頁數
- `progress_chapter` — 首讀期間存入一個章節
- `finish_first` — **首次讀完整本**（唯一 `counts_as_book = true`、發首讀書幣的類型）
- `reread` — 重讀（記錄行為、可給重讀書幣/經驗值，但 `counts_as_book = false`）
- `void` — 沖正分錄（`pages_delta`/`coins_delta`/`exp_delta` 為對應負值，`reverses_deposit_id` 必填）

> **設計要點**：不要為「刪除」寫一支硬刪 SQL。刪除 = 新增一筆 `kind=void` 的分錄。餘額自然回正，歷史保留。

### 3.3 `notes` — 筆記

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| book_id | uuid FK | |
| chapter_label | text null | null = 整本層級的筆記 |
| title | text null | |
| body | text | |
| visibility | text | `public` / `private`，預設 `private` |
| created_at / updated_at | timestamptz | |

### 3.4 `goals` — 目標（撲滿型累積）

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| period | text | `year` / `month` |
| period_key | text | 如 `2026` 或 `2026-07` |
| target_books | int | 目標本數 |
| created_at | timestamptz | |

> 首頁進度條可在「目標達成率」與「距下一等級」之間切換顯示，使用者於設定選偏好。

### 3.5 社群表（第一版可延後，但 schema 先留）

- `follows(follower_id, followee_id, created_at)` — 複合唯一鍵防重複追蹤。
- `reactions(user_id, target_type, target_id, created_at)` — target_type: `book`/`note`；唯一鍵保證一人一讚（冪等）。
- `comments(id, user_id, target_type, target_id, body, created_at)` — 第一版不做巢狀。

---

## 4. 衍生值怎麼算（不是表，是查詢/計算邏輯）

以下全部 `WHERE is_voided = false`（排除已沖正的分錄）。

| 衍生值 | 計算方式 |
|---|---|
| 累積本數 | `COUNT(DISTINCT book_id) WHERE counts_as_book = true` — 用 distinct 天然防重讀灌水 |
| 累積頁數 | `SUM(pages_delta)` |
| 書幣餘額 | `SUM(coins_delta)`（未來寵物消費再加負值分錄或獨立 spend 表） |
| 總經驗值 | `SUM(exp_delta)` |
| 等級 | 用總經驗值查等級對照表（見 §5） |
| 某書目前進度 | 該 book_id 的 `SUM(pages_delta)`，對比 `total_pages` |
| 是否讀完 | `books.first_finished_at IS NOT NULL` |
| 帳列餘額欄 | 依 created_at 排序後，`SUM(counts_as_book) OVER (ORDER BY created_at)` 的 running total |

> **實作提醒**：「累積本數用 `COUNT(DISTINCT book_id) WHERE counts_as_book`」是整個防作弊的核心。重讀不會產生新的 `counts_as_book=true`，所以 distinct 本數不變 —— 不需要任何額外邏輯去「檢查是否重讀」，資料模型本身就防住了。這是把規則編碼進 schema 而非程式的例子。

---

## 5. 等級系統（經驗值 → 等級）

經驗值來源（三個訊號，避開主觀「難易度」）：

| 訊號 | 給 exp 的時機 | 建議權重（可調） |
|---|---|---|
| 本數（基礎量） | `finish_first` 時 | 每本 +100 exp |
| 類型廣度 | 讀完一本「新類型」的書時額外給 | 每新增一種類型 +50 exp |
| 筆記投入 | 為書/章節寫筆記時 | 每則 +20 exp |

等級門檻做成**資料驅動的對照表**（設定檔或 DB），不要寫死在程式：

```json
[
  { "level": 1,  "min_exp": 0,    "title": "初心讀者" },
  { "level": 12, "min_exp": 5400, "title": "雜食讀者" }
]
```

> 上線後一定會想調曲線與稱號，data-driven 讓你改資料不改 code、不重部署。

**等級解鎖「表達」不解鎖「功能」**（不懲罰新手）：解鎖封面樣式、帳本紙質、公開頁主題、稱號、更深的統計圖。

---

## 6. 書幣系統

**第一版只有「賺」沒有「花」**（消費場景 = App 版寵物才開）。

| 行為 | 書幣 | 對應 deposit.kind |
|---|---|---|
| 首次讀完一本書 | +10 | `finish_first` |
| 存入章節 | +3 | `progress_chapter` |
| 存入頁數（每 N 頁） | +N/xx | `progress_pages` |
| 達成勳章 | 一次性獎勵 | （由勳章結算，記一筆 deposit 或獨立來源） |
| 重讀 | 少量或 0 | `reread` |

> 書幣存成「交易流水」（就是 deposits 的 `coins_delta` 加總），不是存一個餘額數字。**這是「留門」的關鍵之一**：未來寵物要花書幣，只是多一種 `coins_delta` 為負的分錄或一張 `coin_spends` 表，完全不動既有資料。

---

## 7. 勳章系統

離散支線成就，資料驅動的規則清單。第一版建議勳章：

| 勳章 | 觸發條件 |
|---|---|
| 初次存入 | 第一筆 deposit |
| 百本達成 | 累積本數 = 100 |
| 連續 30 天 | 連續 30 天有 deposit |
| 深夜讀者 | 深夜時段存入 N 次 |
| 環球書單 | 讀完涵蓋 N 種不同類型 |
| 筆記狂人 | 累積筆記 N 則 |
| 重讀之愛 | 同一本書 reread 達 N 次（獎勵重讀行為） |
| 年度冠軍 | 年度存入達標 |

> 勳章條件也做成 data-driven（一張規則表 / 設定檔），新增勳章不改核心邏輯。

---

## 8. 效能：先簡單，慢了再快取

- **第一版**：所有衍生值即時從 `deposits` 算（`SUM`/`COUNT DISTINCT`）。資料量小，夠快，且不會出錯。
- **之後若慢**：加一張物化快取（如 `user_stats`），存累積本數/頁數/書幣/exp，用資料庫觸發器或 Nitro 定時任務從流水重算。**快取永遠可從流水重建**，流水是唯一真相。
- 帳列餘額用 window function 算 running total；長列表用分頁 / 虛擬捲動（前端你的主場）。

---

## 9. 權限（Supabase RLS，把授權下沉到 DB）

- `books` / `notes` / `deposits`：owner 完整權限；他人僅能讀 `visibility = public` 的資料。
- 公開頁（Profile）：讀取他人 public 的統計、公開書單、公開筆記、等級/勳章。
- `follows` / `reactions` / `comments`：登入者可建立自己的；不可代他人。
- 寫入一律綁 `auth.uid() = user_id`。

> RLS 把「公開/私密」「只有作者能改」寫在資料庫層，前端幾乎不用寫授權邏輯。作品集技術亮點：**授權放在資料層而非應用層**。

---

## 10. 前端 / 架構對應

| 畫面 | 資料來源 |
|---|---|
| 首頁存摺明細（帳列 + 餘額欄） | `deposits` 排序 + running total；可切「存摺明細（無封面）/ 書架（有封面）」兩檢視 |
| 存入頁（選整本/章節/頁數） | 寫入一筆 deposit（kind 依選擇） |
| 書籍詳情 | `books` + 該書 `deposits` 進度 + `notes` |
| 筆記編輯 | `notes` |
| 等級/成就 | 衍生 exp/level + 勳章結算 |
| 年度回顧 | `deposits` 聚合（桌機用 12 月長條時間軸，手機用月方格熱力圖）|
| 公開頁 | 他人 public 衍生值 + `follows`/`reactions` |

**只需要兩支 Nitro server route**（其餘走 Supabase client）：
- `/api/books` — 代理 Google Books API（避免露 key、繞 CORS）
- `/api/summary` — 呼叫 Claude API，把一本書的多則筆記生成閱讀心得摘要（AI 亮點）

---

## 11.「留門」清單（現在做 Web，未來長成 App 不用重寫）

1. 書幣存成 `coins_delta` 流水，不存餘額數字 → 未來寵物消費只是加負分錄。
2. 經驗值存成 `exp_delta` 流水、獨立可累加 → 未來寵物成長階段 = 經驗值的另一種外皮，共用同一來源。
3. 等級門檻 / 勳章規則 data-driven → 未來調整不改 code。
4. Nuxt 4 + PWA 架構 → 未來 PWA 強化即 App beta；需要時 Capacitor 包原生，code 幾乎不動。
5. RWD 桌機斷點 → 同一套 code 兼顧 App 感（手機）與 web app（桌機），作品集雙重證明。

---

## 12. 建議實作順序（單人開發，每階段都有可展示成果）

1. **地基**：Auth + `books` + `deposits`（含 finish_first / 分批存入）+ 首頁帳列 + 統計。可截圖、可自用。
2. **筆記 + 公開/私密**：`notes` + RLS + `/api/books` 加書體驗。
3. **累積回饋**：等級 + 勳章 + 書幣（只賺）+ 年度回顧（桌機時間軸 / 手機熱力圖）。
4. **社群 + AI**：follows/reactions/comments（灌 seed data 撐畫面）+ `/api/summary`。
5. **RWD 桌機斷點打磨** + PWA 強化（可安裝、離線）。

> 每階段結束都有一個能放進作品集的完整東西，不必全做完才能展示。