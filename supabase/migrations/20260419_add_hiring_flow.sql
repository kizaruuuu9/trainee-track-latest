-- 1. Drop existing constraint on job_applications status
ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;

-- 2. Add the new constraint with 'hired' included
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'sent'::text, 'received'::text, 'interview scheduled'::text, 'hired'::text]));

-- 3. Add the employer, job_title, and date_hired columns to the students table to track automated employment details
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS employer text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS date_hired timestamp with time zone;