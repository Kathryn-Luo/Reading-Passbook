begin;
select plan(4);   -- 宣告：我要跑 4 個測試（數字要跟下面 assert 數一致）

-- ==== setup：用預設管理員身份先塞 fixture（此時還沒切 role，繞過 RLS） ====
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'alice@test.com'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bob@test.com');

insert into public.books (id, user_id, title, visibility) values
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Alice 公開書', 'public'),
  ('22222222-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Alice 的私密書', 'private');

-- ==== 從這裡開始假扮 bob ====
set local role authenticated;
set local "request.jwt.claims" to
  '{"sub": "bbbbbbbb-0000-0000-0000-000000000002", "role": "authenticated"}';

-- (1) 非 owner 讀不到別人的 private -> 期望「查不到任何列」
select is_empty(
  $$ select id from public.books where title = 'Alice 的私密書' $$,
  'Bob 看不到 Alice 的私密書'
);

-- (2) 非 owner 讀得到別人的 public -> 期望「能看到 Alice 公開書」
select isnt_empty(
  $$ select id from public.books where title = 'Alice 公開書' $$,
  'Bob 看得到 Alice 的公開書'
);

-- (3) 寫入被綁 auth.uid()：Bob 不能新增掛在 Alice 名下的書
select throws_ok (
  $$ insert into public.books (user_id, title)
  values('aaaaaaaa-0000-0000-0000-000000000001', 'Bob 試圖掛 Alice 名下的書') $$,
  '42501',  -- Postgres RLS 違規的錯誤碼
  null,
  'Bob 不能新增掛在 Alice 名下的書（RLS 阻擋）'
);

-- (4) 正常路徑：Bob 可以建立自己的書
select lives_ok(
  $$ insert into public.books (user_id, title)
    values('bbbbbbbb-0000-0000-0000-000000000002', 'Bob 自己的書') $$,
    'Bob 可以建立自己的書'
);

select * from finish();
rollback; -- 測完全部退掉，不留髒資料