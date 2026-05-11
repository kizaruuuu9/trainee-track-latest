import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';
import toast from 'react-hot-toast';

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, sourceTable }) => {
      const candidateTables = sourceTable
        ? [sourceTable]
        : ['job_applications', 'applications', 'contact_requests'];

      let deleted = false;
      let lastError = '';

      for (const table of candidateTables) {
        const { error, count } = await supabase
          .from(table)
          .delete({ count: 'exact' })
          .eq('id', applicationId);

        if (!error) {
          if (count > 0) {
            deleted = true;
            break;
          }
        }

        lastError = error?.message || 'No rows were affected.';
      }

      if (!deleted) throw new Error(lastError || 'Persistence failed.');
      return applicationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['contactRequests'] });
    },
  });
};
