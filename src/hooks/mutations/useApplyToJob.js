import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

export const useApplyToJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ traineeId, jobId, applicationMessage, resumeUrl, resumeFileName }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session has expired. Please log in again.');

      const actualUserId = session.user.id;

      // Try job_applications table first, then applications as fallback
      const attempts = [
        {
          table: 'job_applications',
          payload: {
            student_id: actualUserId,
            job_id: jobId,
            status: 'pending',
            applied_at: new Date().toISOString(),
            applicant_message: applicationMessage || null,
            resume_url: resumeUrl || null,
            resume_file_name: resumeFileName || null,
          },
        },
        {
          table: 'applications',
          payload: {
            student_id: actualUserId,
            job_posting_id: jobId,
            status: 'pending',
            applicant_message: applicationMessage || null,
            resume_url: resumeUrl || null,
            resume_file_name: resumeFileName || null,
          },
        },
      ];

      let data = null;
      let lastError = null;

      for (const attempt of attempts) {
        const result = await supabase.from(attempt.table).insert(attempt.payload).select().single();
        if (!result.error) {
          data = result.data;
          break;
        }
        lastError = result.error;
        if (['42P01', 'PGRST205'].includes(result.error?.code) ||
            String(result.error?.message || '').toLowerCase().includes('column')) {
          continue;
        }
        throw result.error;
      }

      if (!data) throw lastError || new Error('Could not save application.');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications(variables.traineeId) });
    },
  });
};
