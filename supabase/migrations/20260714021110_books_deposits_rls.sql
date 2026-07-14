create type book_status as enum ('reading', 'finished');
create type deposit_kind as enum ('progress_pages', 'progress_chapter', 'finish_first', 'reread', 'void');
create type book_source as enum ('google_books', 'manual');
create type visibility as enum ('public', 'private');

-- 建立 book 表
create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text null,
  isbn text null,
  total_pages int null,
  cover_url text null,
  source book_source not null default 'manual',
  status book_status not null default 'reading',
  first_finished_at timestamptz null,
  visibility visibility not null default 'private',
  created_at timestamptz not null default now()
);

-- 建立存入流水表
create table public.deposits(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  kind deposit_kind not null,
  pages_delta int not null default 0,
  chapter_label text null,
  to_page int null,
  coins_delta int not null default 0,
  exp_delta int not null default 0,
  counts_as_book boolean not null default false,
  reverses_deposit_id uuid null references public.deposits (id),
  is_voided boolean not null default false,
  created_at timestamptz not null default now()
);

-- 表層授權：GRANT 管「誰可以操作」，RLS 管「每個操作能不能通過」
grant select, insert, update, delete on public.books to authenticated;
grant select                         on public.books to anon;

grant select, insert                 on public.deposits to authenticated; -- append-only：故意不給 update, delete
grant select                         on public.deposits to anon;


-- INDEX
-- 首頁存摺明細：抓某使用者的存入、按時間新到舊排列
create index idx_deposits_user_created on public.deposits(user_id, created_at desc);

-- 算單一本書的進度
create index idx_deposits_book on public.deposits(book_id);

-- 抓某使用者的書庫
create index idx_books_user on public.books(user_id);



alter table public.deposits enable row level security;

-- (1) SELECT：自己的全看得到；別人只看得到「所屬 book 為 public」的存入
create policy "deposits_select_own_or_public_book"
on public.deposits
for select
to authenticated, anon
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.books b
    where b.id = deposits.book_id
      and b.visibility = 'public'
  )
);

-- (2) INSERT：只能新增掛在自己名下的（滿足「寫入強制 auth.uid()」 = user_id）
create policy "deposits_insert_own"
on public.deposits
for insert
to authenticated
with check(
  (select auth.uid()) = user_id
);

-- (3)(4) 刻意不寫：deposits 是 append-only 帳本
--   要「刪」→ 新增一筆 kind='void' 的沖正分錄（也是走上面的 INSERT policy）
--   要「改」→ 不允許，維持歷史不可竄改


alter table public.books enable row level security;

-- SELECT
create policy "books_select_own_or_public"
on public.books
for select
to authenticated, anon
using (
  (select auth.uid()) = user_id
  or visibility = 'public'
);

-- INSERT
create policy "books_insert_own"
on public.books
for insert
to authenticated
with check(
  (select auth.uid()) = user_id
);


-- UPDATE
create policy "books_update_own"
on public.books
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);


-- DELETE
create policy "books_delete_own"
on public.books
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);


