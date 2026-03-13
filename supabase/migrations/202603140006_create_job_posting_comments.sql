create table if not exists public.job_posting_comments (
  id uuid primary key default gen_random_uuid(),
  job_posting_id uuid not null references public.job_postings(id) on delete cascade,
  author_id uuid not null,
  author_type text not null check (author_type in ('student', 'industry_partner')),
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_job_posting_comments_job_posting_id on public.job_posting_comments(job_posting_id);
create index if not exists idx_job_posting_comments_author_id on public.job_posting_comments(author_id);
create index if not exists idx_job_posting_comments_created_at on public.job_posting_comments(created_at desc);

alter table public.job_posting_comments enable row level security;

drop policy if exists "job_posting_comments_select_authenticated" on public.job_posting_comments;
create policy "job_posting_comments_select_authenticated"
on public.job_posting_comments
for select
to authenticated
using (true);

drop policy if exists "job_posting_comments_insert_own" on public.job_posting_comments;
create policy "job_posting_comments_insert_own"
on public.job_posting_comments
for insert
to authenticated
with check (auth.uid() = author_id);

drop policy if exists "job_posting_comments_update_own" on public.job_posting_comments;
create policy "job_posting_comments_update_own"
on public.job_posting_comments
for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "job_posting_comments_delete_own" on public.job_posting_comments;
create policy "job_posting_comments_delete_own"
on public.job_posting_comments
for delete
to authenticated
using (auth.uid() = author_id);
