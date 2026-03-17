-- =============================================================
-- TraineeTrack V2 — Supabase Public Schema
-- Extracted: 2026-03-13 via PostgREST OpenAPI
-- =============================================================

-- 1. profiles
CREATE TABLE profiles (
  id           uuid PRIMARY KEY,
  user_type    text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- 2. programs
CREATE TABLE programs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  nc_level        text,
  duration_hours  integer,
  description     text,
  competencies    text[] DEFAULT '{}'::text[],
  is_active       boolean DEFAULT true,
  sort_order      integer DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

-- 4. students
CREATE TABLE students (
  id                  uuid PRIMARY KEY,
  full_name           text,
  student_id          text,
  program_id          uuid REFERENCES programs(id),
  phone               text,
  birthdate           date,
  gender              text,
  region              text,
  province            text,
  city                text,
  barangay            text,
  detailed_address    text,
  selfie_url          text,
  banner_url          text,
  front_id_url        text,
  back_id_url         text,
  employment_status   text DEFAULT 'not_employed',
  employment_work     text,
  employment_start    text,
  graduate_school     text,
  educ_history        jsonb,
  work_experience     jsonb,
  resume_url          text,
  profile_completed   boolean DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  profile_picture_url text,
  skills              text[],
  interests           text[],
  certifications      jsonb,
  graduation_year     text,
  training_status     text,
  contact_email       text,
  activity_status     text DEFAULT 'Offline',
  last_seen_at        timestamptz,
  personal_info_visibility text[] DEFAULT ARRAY['name'::text, 'birthday'::text, 'gender'::text]
);

-- 5. industry_partners
CREATE TABLE industry_partners (
  id                  uuid PRIMARY KEY,
  company_name        text NOT NULL,
  business_permit_url text,
  business_type       text,
  company_size        text,
  website             text,
  contact_person      text,
  contact_email       text,
  contact_phone       text,
  company_logo_url    text,
  region              text,
  province            text,
  city                text,
  barangay            text,
  detailed_address    text,
  verification_status text DEFAULT 'pending',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  achievements        text[],
  benefits            text[],
  activity_status     text DEFAULT 'Offline',
  last_seen_at        timestamptz,
  company_info_visibility text[] DEFAULT ARRAY['companyName'::text, 'contactPerson'::text, 'industry'::text]
);

-- 6. otp_codes
CREATE TABLE otp_codes (
  email       text PRIMARY KEY,
  otp         text NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- 7. posts
CREATE TABLE posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   uuid NOT NULL,
  author_type text NOT NULL,
  post_type   text NOT NULL DEFAULT 'general',
  title       text,
  content     text NOT NULL,
  media_url   text,
  tags        text[],
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 8. job_postings
CREATE TABLE job_postings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      uuid REFERENCES industry_partners(id),
  program_id      uuid REFERENCES programs(id),
  nc_level        text,
  title           text NOT NULL,
  opportunity_type text DEFAULT 'Job',
  company_name    text,
  description     text,
  requirements    text[],
  required_competencies text[] DEFAULT '{}'::text[],
  required_skills text[] DEFAULT '{}'::text[],
  location        text,
  salary_min      numeric,
  salary_max      numeric,
  salary_range    text,
  employment_type text,
  slots           integer DEFAULT 1,
  status          text DEFAULT 'Open',
  industry        text DEFAULT 'General',
  source          text DEFAULT 'partner',
  source_url      text,
  attachment_name text,
  attachment_type text,
  attachment_url  text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  expires_at      timestamptz
);

-- 9. job_applications
CREATE TABLE job_applications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES students(id),
  job_id      uuid NOT NULL REFERENCES job_postings(id),
  status      text DEFAULT 'pending',
  applied_at  timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  notes       text,
  applicant_message          text,
  resume_url                 text,
  resume_file_name           text,
  recruitment_message        text,
  recruitment_document_name  text,
  recruitment_document_url   text,
  recruitment_sent_at        timestamptz
);

-- 10. partner_verifications
CREATE TABLE partner_verifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id    uuid NOT NULL REFERENCES industry_partners(id),
  document_type text NOT NULL,
  label         text NOT NULL,
  file_url      text NOT NULL,
  file_name     text NOT NULL,
  file_type     text NOT NULL,
  uploaded_at   timestamptz DEFAULT now(),
  notes         text
);

-- 11. student_documents
CREATE TABLE student_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES students(id),
  category    text NOT NULL,
  label       text NOT NULL,
  issuer      text,
  date_issued date,
  expiry_date date,
  file_url    text NOT NULL,
  file_name   text NOT NULL,
  file_type   text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- 12. student_skills
CREATE TABLE student_skills (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        uuid NOT NULL REFERENCES students(id),
  skill_name        text NOT NULL,
  proficiency_level text DEFAULT 'beginner'
);

-- 13. student_interests
CREATE TABLE student_interests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES students(id),
  interest_name text NOT NULL
);

-- 16. post_comments
CREATE TABLE post_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL,
  author_type text NOT NULL CHECK (author_type IN ('student', 'industry_partner')),
  content     text NOT NULL CHECK (length(trim(content)) > 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 17. contact_requests
CREATE TABLE contact_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid REFERENCES posts(id) ON DELETE SET NULL,
  job_posting_id  uuid,
  sender_id       uuid NOT NULL,
  sender_type     text NOT NULL CHECK (sender_type IN ('student', 'industry_partner')),
  recipient_id    uuid NOT NULL,
  recipient_type  text NOT NULL CHECK (recipient_type IN ('student', 'industry_partner')),
  message         text NOT NULL CHECK (length(trim(message)) > 0),
  attachment_name text,
  attachment_url  text,
  attachment_kind text NOT NULL DEFAULT 'document' CHECK (attachment_kind IN ('resume', 'document')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 18. job_posting_comments
CREATE TABLE job_posting_comments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  author_id      uuid NOT NULL,
  author_type    text NOT NULL CHECK (author_type IN ('student', 'industry_partner')),
  content        text NOT NULL CHECK (length(trim(content)) > 0),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_programs_name ON programs(name);
CREATE INDEX IF NOT EXISTS idx_students_last_seen_at ON students(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_industry_partners_last_seen_at ON industry_partners(last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_requests_post_id ON contact_requests(post_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_job_posting_id ON contact_requests(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_sender_id ON contact_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_recipient_id ON contact_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_posting_comments_job_posting_id ON job_posting_comments(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_posting_comments_author_id ON job_posting_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_job_posting_comments_created_at ON job_posting_comments(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_programs_variant_normalized
ON programs (
  lower(trim(regexp_replace(name, '\\s+', ' ', 'g'))),
  lower(trim(coalesce(nc_level, ''))),
  coalesce(duration_hours, 0)
);

ALTER TABLE job_postings
  DROP CONSTRAINT IF EXISTS job_postings_employment_type_check;

ALTER TABLE job_postings
  ADD CONSTRAINT job_postings_employment_type_check
  CHECK (
    employment_type IS NULL
    OR employment_type = ANY (ARRAY[
      'full_time'::text,
      'part_time'::text,
      'ojt'::text,
      'contractual'::text,
      'contract'::text,
      'internship'::text
    ])
  ) NOT VALID;

-- RPC function
-- is_admin() — returns boolean, checks if current user is admin
