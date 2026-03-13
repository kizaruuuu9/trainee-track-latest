alter table if exists public.applications
  add column if not exists applicant_message text,
  add column if not exists resume_url text,
  add column if not exists resume_file_name text,
  add column if not exists recruitment_message text,
  add column if not exists recruitment_document_name text,
  add column if not exists recruitment_document_url text,
  add column if not exists recruitment_sent_at timestamptz;

alter table if exists public.job_applications
  add column if not exists applicant_message text,
  add column if not exists resume_url text,
  add column if not exists resume_file_name text,
  add column if not exists recruitment_message text,
  add column if not exists recruitment_document_name text,
  add column if not exists recruitment_document_url text,
  add column if not exists recruitment_sent_at timestamptz;
