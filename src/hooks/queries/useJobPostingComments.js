import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

const fetchJobPostingComments = async () => {
  const { data, error } = await supabase
    .from('job_posting_comments')
    .select('id, job_posting_id, author_id, author_type, content, created_at, updated_at')
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST204' || error.code === 'PGRST205') {
      console.warn('job_posting_comments table not found.');
      return [];
    }
    throw error;
  }

  return data || [];
};

export const useJobPostingComments = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.jobPostingComments(),
    queryFn: fetchJobPostingComments,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};
