import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, status, notes, sourceTable, metadata }) => {
      const candidateTables = sourceTable
        ? [sourceTable]
        : ['job_applications', 'applications', 'contact_requests'];

      let persisted = false;
      let lastError = '';

      for (const table of candidateTables) {
        let statusToPersist = status.toLowerCase();

        // Normalize status for contact_requests table
        if (table === 'contact_requests') {
          if (['shortlisted', 'interview requested', 'interview confirmed',
               'interview scheduled', 'reschedule requested'].includes(statusToPersist)) {
            statusToPersist = 'reviewed';
          } else if (statusToPersist === 'hired') {
            statusToPersist = 'accepted';
          }
        }

        const updatePayload = {
          status: statusToPersist,
          notes: notes || null,
          reviewed_at: new Date().toISOString(),
        };

        const proposedDate = metadata?.proposedInterviewDate || metadata?.proposed_interview_date;
        if (proposedDate !== undefined && table !== 'contact_requests') {
          updatePayload.proposed_interview_date = proposedDate;
        }

        const { data, error } = await supabase
          .from(table)
          .update(updatePayload)
          .eq('id', applicationId)
          .select();

        if (error) {
          lastError = error.message;
          if (['42P01', 'PGRST205', 'PGRST204', '42703'].includes(error?.code) ||
              String(error?.message || '').toLowerCase().includes('column')) {
            continue;
          }
        }

        if (data && data.length > 0) {
          persisted = true;
          break;
        }
      }

      if (!persisted) {
        throw new Error(lastError || 'Failed to persist status update.');
      }

      return { applicationId, status, notes };
    },
    onSuccess: () => {
      // Invalidate all application and contact request caches
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['contactRequests'] });
    },
  });
};
