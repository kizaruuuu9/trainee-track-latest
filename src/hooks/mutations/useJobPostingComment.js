import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

export const useAddJobPostingComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobPostingId, authorId, authorType, content }) => {
      const trimmed = content?.trim();
      if (!trimmed) throw new Error('Comment cannot be empty.');

      const { data, error } = await supabase
        .from('job_posting_comments')
        .insert([{
          job_posting_id: jobPostingId,
          author_id: authorId,
          author_type: authorType,
          content: trimmed,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        if (['42P01', 'PGRST204', 'PGRST205'].includes(error.code)) {
          throw new Error('Comments table not available. Apply the latest migrations.');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobPostingComments() });
    },
  });
};

export const useUpdateJobPostingComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, authorId, content }) => {
      const trimmed = content?.trim();
      if (!trimmed) throw new Error('Comment cannot be empty.');

      const { data, error } = await supabase
        .from('job_posting_comments')
        .update({ content: trimmed, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('author_id', authorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobPostingComments() });
    },
  });
};

export const useDeleteJobPostingComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, authorId }) => {
      const { error } = await supabase
        .from('job_posting_comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', authorId);

      if (error) throw error;
      return { commentId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobPostingComments() });
    },
  });
};
