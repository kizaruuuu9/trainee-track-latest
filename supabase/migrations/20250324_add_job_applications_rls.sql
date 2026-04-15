-- Enable Row Level Security on job_applications table
ALTER TABLE public."job_applications" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "allow_student_insert_application" ON public."job_applications";
DROP POLICY IF EXISTS "allow_student_read_application" ON public."job_applications";
DROP POLICY IF EXISTS "allow_student_update_application" ON public."job_applications";
DROP POLICY IF EXISTS "allow_partner_read_application" ON public."job_applications";
DROP POLICY IF EXISTS "allow_partner_update_application" ON public."job_applications";

-- Policy: Allow students to insert their own applications
CREATE POLICY "allow_student_insert_application" ON public."job_applications"
    FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Policy: Allow students to read their own applications
CREATE POLICY "allow_student_read_application" ON public."job_applications"
    FOR SELECT
    USING (auth.uid() = student_id);

-- Policy: Allow students to update their own applications (status updates, etc.)
CREATE POLICY "allow_student_update_application" ON public."job_applications"
    FOR UPDATE
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- Policy: Allow partners to read applications for their job postings
CREATE POLICY "allow_partner_read_application" ON public."job_applications"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public."job_postings" jp
            WHERE jp.id = job_applications.job_id
            AND jp.partner_id = auth.uid()
        )
    );

-- Policy: Allow partners to update applications for their job postings
CREATE POLICY "allow_partner_update_application" ON public."job_applications"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public."job_postings" jp
            WHERE jp.id = job_applications.job_id
            AND jp.partner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public."job_postings" jp
            WHERE jp.id = job_applications.job_id
            AND jp.partner_id = auth.uid()
        )
    );
