begin;
select plan(4);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'alice@test.com'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bob@test.com');

insert into public.books (id, user_id, title, visibility) values
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Alice 公開書', 'public'),
  ('11111111-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Alice 的私密書', 'private'),
  ('11111111-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000002', 'Bob 的私密書', 'private');


insert into public.deposits (id, user_id, book_id, kind, pages_delta, chapter_label, to_page, coins_delta, exp_delta, counts_as_book, reverses_deposit_id, is_voided, created_at) values
  (
    -- Alice 公開書的 deposit
    'd0000000-0000-0000-0000-000000000000', -- id
    'aaaaaaaa-0000-0000-0000-000000000001', -- user_id
    '11111111-0000-0000-0000-000000000001', -- book_id
    'progress_pages', -- kind
    100, -- pages_delta
    '1-5章', -- chapter_label
    100, -- to_page
    100, -- coins_delta
    100, -- exp_delta
    true, -- counts_as_book
    null, -- reverses_deposit_id
    false, -- is_voided
    '2026-01-01 10:00:00+08' -- created_at
  ),
  (
    -- Alice 私密書的 deposit
    'd0000000-0000-0000-0000-000000000001', -- id
    'aaaaaaaa-0000-0000-0000-000000000001', -- user_id
    '11111111-0000-0000-0000-000000000002', -- book_id
    'progress_pages', -- kind
    100, -- pages_delta
    '1-5章', -- chapter_label
    100, -- to_page
    100, -- coins_delta
    100, -- exp_delta
    true, -- counts_as_book
    null, -- reverses_deposit_id
    false, -- is_voided
    '2026-01-01 11:00:00+08' -- created_at
  ),
  (
    -- Bob 私密書的 deposit
    'd0000000-0000-0000-0000-000000000002', -- id
    'bbbbbbbb-0000-0000-0000-000000000002', -- user_id
    '11111111-0000-0000-0000-000000000003', -- book_id
    'progress_pages', -- kind
    20, -- pages_delta
    '1-5章', -- chapter_label
    100, -- to_page
    100, -- coins_delta
    100, -- exp_delta
    true, -- counts_as_book
    null, -- reverses_deposit_id
    false, -- is_voided
    '2026-01-02 11:00:00+08' -- created_at
  );


-- ====從這裡開始假扮 bob ====
set local role authenticated;
set local "request.jwt.claims" to
  '{"sub": "bbbbbbbb-0000-0000-0000-000000000002", "role": "authenticated"}';
  
-- (1)  Bob 讀不到 alice 私密書底下的 deposit
select is_empty (
  $$ select id from public.deposits where id = 'd0000000-0000-0000-0000-000000000001' $$,
  'Bob 讀不到 alice 私密書底下的 deposit'
);

-- (2) Bob 讀得到 alice 公開書底下的 deposit
select isnt_empty (
  $$ select id from public.deposits where id = 'd0000000-0000-0000-0000-000000000000' $$,
  'Bob 讀得到 alice 公開書底下的 deposit'
);

-- (3) Bob 不能新增掛在 alice 名下的 deposit
select throws_ok (
  $$ insert into public.deposits (id, user_id, book_id, kind, pages_delta, chapter_label, to_page, coins_delta, exp_delta, counts_as_book, reverses_deposit_id, is_voided, created_at)
  values(
    'd0000000-0000-0000-0000-000000000003', -- id
    'aaaaaaaa-0000-0000-0000-000000000001', -- user_id
    '11111111-0000-0000-0000-000000000001', -- book_id
    'progress_pages', -- kind
    100, -- pages_delta
    '1-5章', -- chapter_label
    100, -- to_page
    100, -- coins_delta
    100, -- exp_delta
    true, -- counts_as_book
    null, -- reverses_deposit_id
    false, -- is_voided
    '2026-01-01 10:00:00+08' -- created_at
  ) $$,
  '42501',
  null,
  'Bob 不能寫 alice 的存入流水（不論書是公開或私密）'
);

-- (4) Bob 可以新增自己的書的 deposit
select lives_ok (
  $$ insert into public.deposits (id, user_id, book_id, kind, pages_delta, chapter_label, to_page, coins_delta, exp_delta, counts_as_book, reverses_deposit_id, is_voided, created_at)
  values(
    'd0000000-0000-0000-0000-000000000004', -- id
    'bbbbbbbb-0000-0000-0000-000000000002', -- user_id
    '11111111-0000-0000-0000-000000000003', -- book_id
    'progress_pages', -- kind
    100, -- pages_delta
    '1-5章', -- chapter_label
    100, -- to_page
    100, -- coins_delta
    100, -- exp_delta
    true, -- counts_as_book
    null, -- reverses_deposit_id
    false, -- is_voided
    '2026-01-03 10:00:00+08' -- created_at
  ) $$,
  'Bob 可以新增自己的書的 deposit'
);