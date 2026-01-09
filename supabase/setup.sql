-- 1. 推論結果保存用テーブルの作成
create table if not exists public.inference_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  image_path text not null,
  result_json jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- テーブルのRLS（行レベルセキュリティ）を有効化
alter table public.inference_logs enable row level security;

-- 自分が作成したログのみ参照・追加できるポリシー
create policy "Users can insert their own logs"
  on public.inference_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own logs"
  on public.inference_logs for select
  using (auth.uid() = user_id);


-- 2. 画像保存用バケット（xray-images）の作成
insert into storage.buckets (id, name, public)
values ('xray-images', 'xray-images', false)
on conflict (id) do nothing;

-- ストレージのRLSポリシー設定（ユーザーごとに自分のフォルダのみアクセス可能）
-- SELECT（参照）
create policy "Give users access to own folder select" on storage.objects
  for select
  to authenticated
  using (bucket_id = 'xray-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- INSERT（追加）
create policy "Give users access to own folder insert" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'xray-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- UPDATE（更新）
create policy "Give users access to own folder update" on storage.objects
  for update
  to authenticated
  using (bucket_id = 'xray-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- DELETE（削除）
create policy "Give users access to own folder delete" on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'xray-images' and (storage.foldername(name))[1] = auth.uid()::text);