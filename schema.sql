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
  is_active       boolean DEFAULT true,
  sort_order      integer DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

-- 3. competencies
CREATE TABLE competencies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now()
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
  contact_email       text
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
  benefits            text[]
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
  title           text NOT NULL,
  company_name    text,
  description     text,
  requirements    text[],
  location        text,
  salary_min      numeric,
  salary_max      numeric,
  employment_type text,
  slots           integer DEFAULT 1,
  source          text DEFAULT 'partner',
  source_url      text,
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
  notes       text
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

-- 14. program_competencies (composite PK)
CREATE TABLE program_competencies (
  program_id    uuid NOT NULL REFERENCES programs(id),
  competency_id uuid NOT NULL REFERENCES competencies(id),
  category      text NOT NULL,
  sort_order    integer DEFAULT 0,
  PRIMARY KEY (program_id, competency_id)
);

-- 15. student_competencies (composite PK)
CREATE TABLE student_competencies (
  student_id    uuid NOT NULL REFERENCES students(id),
  competency_id uuid NOT NULL REFERENCES competencies(id),
  acquired_at   timestamptz DEFAULT now(),
  PRIMARY KEY (student_id, competency_id)
);

-- RPC function
-- is_admin() — returns boolean, checks if current user is admin
