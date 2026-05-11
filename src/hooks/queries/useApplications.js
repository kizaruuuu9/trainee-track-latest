import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

const normalizeApplicationStatus = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'shortlisted') return 'Shortlisted';
  if (raw === 'interview requested') return 'Interview Requested';
  if (raw === 'interview confirmed') return 'Interview Confirmed';
  if (raw === 'interview declined') return 'Interview Declined';
  if (raw === 'reschedule requested') return 'Reschedule Requested';
  if (raw === 'interview scheduled') return 'Interview Scheduled';
  if (raw === 'accepted') return 'Accepted';
  if (raw === 'rejected') return 'Rejected';
  if (raw === 'hired') return 'Hired';
  if (raw === 'sent') return 'Sent';
  if (raw === 'received') return 'Received';
  return 'Pending';
};

const isSchemaMissingError = (error) => ['42P01', 'PGRST205'].includes(error?.code);

const fetchApplications = async (userId, userRole, jobPostings = []) => {
  if (!userId || typeof userId !== 'string' || userId.length !== 36) return [];

  const combinedApps = [];
  const sources = [
    { table: 'job_applications', orderColumn: 'applied_at' },
  ];

  for (const source of sources) {
    let query = supabase
      .from(source.table)
      .select('id, student_id, job_id, status, applied_at, reviewed_at, notes, applicant_message, resume_url, resume_file_name, recruitment_message, recruitment_document_name, recruitment_document_url, recruitment_sent_at, proposed_interview_date');

    if (userRole === 'trainee') {
      query = query.eq('student_id', userId);
    } else if (userRole === 'partner') {
      let pids = jobPostings
        .filter(j => String(j.partnerId) === String(userId))
        .map(j => j.id);

      if (pids.length === 0) {
        const { data: jobs } = await supabase.from('job_postings').select('id').eq('partner_id', userId);
        if (jobs) pids = jobs.map(j => j.id);
      }

      if (pids.length > 0) {
        query = query.in('job_id', pids);
      } else {
        continue;
      }
    }

    const { data, error } = await query.order(source.orderColumn, { ascending: false });

    if (error) {
      if (!isSchemaMissingError(error)) {
        console.warn(`Failed to fetch ${source.table}:`, error);
      }
      continue;
    }

    combinedApps.push(...(data || []).map(row => ({ ...row, __sourceTable: source.table })));
  }

  return combinedApps
    .filter(a => (a.student_id || a.trainee_id) && (a.job_posting_id || a.job_id))
    .map(a => ({
      id: a.id,
      traineeId: a.student_id || a.trainee_id,
      jobId: a.job_posting_id || a.job_id,
      status: normalizeApplicationStatus(a.status),
      appliedAt: (a.created_at || a.applied_at || '').split('T')[0] || null,
      reviewedAt: a.reviewed_at ? a.reviewed_at.split('T')[0] : null,
      notes: a.notes || null,
      applicationMessage: a.applicant_message || a.application_message || null,
      resumeUrl: a.resume_url || null,
      resumeFileName: a.resume_file_name || null,
      recruitMessage: a.recruitment_message || a.recruiter_message || null,
      recruitDocumentName: a.recruitment_document_name || a.recruiter_document_name || null,
      recruitDocumentUrl: a.recruitment_document_url || a.recruiter_document_url || null,
      recruitSentAt: a.recruitment_sent_at ? a.recruitment_sent_at.split('T')[0] : null,
      proposedInterviewDate: a.proposed_interview_date || null,
      sourceTable: a.__sourceTable || null,
    }));
};

export const useApplications = (userId, userRole, jobPostings = [], options = {}) => {
  return useQuery({
    queryKey: queryKeys.applications(userId),
    queryFn: () => fetchApplications(userId, userRole, jobPostings),
    staleTime: 60 * 1000, // 1 minute
    enabled: !!userId && typeof userId === 'string' && userId.length === 36,
    ...options,
  });
};
