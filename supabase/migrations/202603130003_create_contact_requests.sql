create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete set null,
  job_posting_id uuid,
  sender_id uuid not null,
  sender_type text not null check (sender_type in ('student', 'industry_partner')),
  recipient_id uuid not null,
  recipient_type text not null check (recipient_type in ('student', 'industry_partner')),
  message text not null check (length(trim(message)) > 0),
  attachment_name text,
  attachment_url text,
  attachment_kind text not null default 'document' check (attachment_kind in ('resume', 'document')),
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_requests_post_id on public.contact_requests(post_id);
create index if not exists idx_contact_requests_job_posting_id on public.contact_requests(job_posting_id);
create index if not exists idx_contact_requests_sender_id on public.contact_requests(sender_id);
create index if not exists idx_contact_requests_recipient_id on public.contact_requests(recipient_id);
create index if not exists idx_contact_requests_created_at on public.contact_requests(created_at desc);

alter table public.contact_requests enable row level security;

drop policy if exists "contact_requests_select_participants" on public.contact_requests;
create policy "contact_requests_select_participants"
on public.contact_requests
for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "contact_requests_insert_sender" on public.contact_requests;
create policy "contact_requests_insert_sender"
on public.contact_requests
for insert
to authenticated
with check (auth.uid() = sender_id);

drop policy if exists "contact_requests_update_sender" on public.contact_requests;
create policy "contact_requests_update_sender"
on public.contact_requests
for update
to authenticated
using (auth.uid() = sender_id)
with check (auth.uid() = sender_id);

drop policy if exists "contact_requests_delete_sender" on public.contact_requests;
create policy "contact_requests_delete_sender"
on public.contact_requests
for delete
to authenticated
using (auth.uid() = sender_id);