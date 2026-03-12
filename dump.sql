-- Schema dump from Supabase OpenAPI spec
-- Generated: 2026-03-12T04:42:53.470Z

CREATE TABLE public.profiles (
  id UUID NOT NULL  -- Note:
This is a Primary Key.<pk/>,
  user_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT 'now()'
);

CREATE TABLE public.student_competencies (
  student_id UUID NOT NULL  -- Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `students.id`.<fk table='students' column='id'/>,
  competency_id UUID NOT NULL  -- Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `competencies.id`.<fk table='competencies' column='id'/>,
  acquired_at TIMESTAMPTZ DEFAULT 'now()'
);

CREATE TABLE public.otp_codes (
  email TEXT NOT NULL  -- Note:
This is a Primary Key.<pk/>,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT 'now()'
);

CREATE TABLE public.industry_partners (
  id UUID NOT NULL  -- Note:
This is a Primary Key.<pk/>,
  company_name TEXT NOT NULL,
  business_permit_url TEXT,
  business_type TEXT,
  company_size TEXT,
  website TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  company_logo_url TEXT,
  region TEXT,
  province TEXT,
  city TEXT,
  barangay TEXT,
  detailed_address TEXT,
  verification_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT 'now()',
  updated_at TIMESTAMPTZ DEFAULT 'now()',
  achievements TEXT[],
  benefits TEXT[]
);

CREATE TABLE public.student_skills (
  id UUID NOT NULL DEFAULT 'gen_random_uuid()'  -- Note:
This is a Primary Key.<pk/>,
  student_id UUID NOT NULL  -- Note:
This is a Foreign Key to `students.id`.<fk table='students' column='id'/>,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT DEFAULT 'beginner'
);

CREATE TABLE public.student_interests (
  id UUID NOT NULL DEFAULT 'gen_random_uuid()'  -- Note:
This is a Primary Key.<pk/>,
  student_id UUID NOT NULL  -- Note:
This is a Foreign Key to `students.id`.<fk table='students' column='id'/>,
  interest_name TEXT NOT NULL
);

CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT 'gen_random_uuid()'  -- Note:
This is a Primary Key.<pk/>,
  author_id UUID NOT NULL,
  author_type TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'general',
  title TEXT,
  content TEXT NOT NULL,
  media_url TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT 'now()',
  updated_at TIMESTAMPTZ DEFAULT 'now()'
);

CREATE TABLE public.competencies (
  id UUID NOT NULL DEFAULT 'gen_random_uuid()'  -- Note:
This is a Primary Key.<pk/>,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT 'now()'
);

CREATE TABLE public.job_postings (
  id UUID NOT NULL DEFAULT 'gen_random_uuid()'  -- Note:
This is a Primary Key.<pk/>,
  partner_id UUID  -- Note:
This is a Foreign Key to `industry_partners.id`.<fk table='industry_partners' column='id'/>,
  program_id UUID  -- Note:
This is a Foreign Key to `programs.id`.<fk table='programs' column='id'/>,
  title TEXT NOT NULL,
  company_name TEXT,
  description TEXT,
  requirements TEXT[],
  location TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  employment_type TEXT,
  slots INTEGER DEFAULT 1,
  source TEXT DEFAULT 'partner',
  source_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT 'now()',
  expires_at TIMESTAMPTZ
);

CREATE TABLE public.students (
  id UUID NOT NULL  -- Note:
This is a Primary Key.<pk/>,
  full_name TEXT,
  student_id TEXT,
  program_id UUID  -- Note:
This is a Foreign Key to `programs.id`.<fk table='programs' column='id'/>,
  phone TEXT,
  birthdate DATE,
  gender TEXT,
  region TEXT,
  province TEXT,
  city TEXT,
  barangay TEXT,
  detailed_address TEXT,
  selfie_url TEXT,
  banner_url TEXT,
  front_id_url TEXT,
  back_id_url TEXT,
  employment_status TEXT DEFAULT 'not_employed',
  employment_work TEXT,
  employment_start TEXT,
  graduate_school TEXT,
  educ_history JSONB,
  work_experience JSONB,
  resume_url TEXT,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT 'now()',
  updated_at TIMESTAMPTZ DEFAULT 'now()',
  profile_picture_url TEXT,
  skills TEXT[],
  interests TEXT[],
  certifications JSONB,
  graduation_year TEXT,
  training_status TEXT,
  contact_email TEXT
);

CREATE TABLE public.program_competencies (
  program_id UUID NOT NULL  -- Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `programs.id`.<fk table='programs' column='id'/>,
  competency_id UUID NOT NULL  -- Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `competencies.id`.<fk table='competencies' column='id'/>,
  category TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE public.student_documents (
  id UUID NOT NULL DEFAULT 'gen_random_uuid()'  -- Note:
This is a Primary Key.<pk/>,
  student_id UUID NOT NULL  -- Note:
This is a Foreign Key to `students.id`.<fk table='students' column='id'/>,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  issuer TEXT,
  date_issued DATE,
  expiry_date DATE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT 'now()'
);

CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT 'gen_random_uuid()'  -- Note:
This is a Primary Key.<pk/>,
  student_id UUID NOT NULL  -- Note:
This is a Foreign Key to `students.id`.<fk table='students' column='id'/>,
  job_id UUID NOT NULL  -- Note:
This is a Foreign Key to `job_postings.id`.<fk table='job_postings' column='id'/>,
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT 'now()',
  reviewed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT 'gen_random_uuid()'  -- Note:
This is a Primary Key.<pk/>,
  name TEXT NOT NULL,
  nc_level TEXT,
  duration_hours INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT 'now()'
);

