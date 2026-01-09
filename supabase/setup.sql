-- Create inference_logs table
create table public.inference_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  image_path text not null,
  result_json jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.inference_logs enable row level security;

-- Policies for inference_logs
create policy "Users can insert their own logs"
  on public.inference_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own logs"
  on public.inference_logs for select
  using (auth.uid() = user_id);

-- Storage Bucket Setup
-- Note: This usually needs to be done via dashboard or API, but SQL can configure policies if bucket exists.
-- Assuming bucket 'xray-images' is created.

insert into storage.buckets (id, name, public)
values ('xray-images', 'xray-images', false)
on conflict (id) do nothing;

-- Storage Policies
create policy "Give users access to own folder 1ok22a_0" on storage.objects
  for select
  to authenticated
  using (bucket_id = 'xray-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Give users access to own folder 1ok22a_1" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'xray-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Give users access to own folder 1ok22a_2" on storage.objects
  for update
  to authenticated
  using (bucket_id = 'xray-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Give users access to own folder 1ok22a_3" on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'xray-images' and (storage.foldername(name))[1] = auth.uid()::text);
