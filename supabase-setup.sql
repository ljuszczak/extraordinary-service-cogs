
-- Run this in Supabase SQL Editor AFTER you create a project.
-- It creates the submissions table and basic Row Level Security policies.
-- IMPORTANT: review these policies before a public event.

create table if not exists public.submissions (
  id uuid primary key,
  participant_name text,
  image_path text not null,
  created_at timestamptz not null default now()
);

alter table public.submissions enable row level security;

drop policy if exists "public can insert submissions" on public.submissions;
create policy "public can insert submissions"
on public.submissions for insert
to anon
with check (true);

drop policy if exists "public can read submissions" on public.submissions;
create policy "public can read submissions"
on public.submissions for select
to anon
using (true);

-- Storage policies assume you create a bucket named: cogs
drop policy if exists "public can upload cog images" on storage.objects;
create policy "public can upload cog images"
on storage.objects for insert
to anon
with check (bucket_id = 'cogs');

drop policy if exists "public can read cog images" on storage.objects;
create policy "public can read cog images"
on storage.objects for select
to anon
using (bucket_id = 'cogs');
