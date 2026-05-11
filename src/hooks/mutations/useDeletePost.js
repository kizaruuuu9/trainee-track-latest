import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, authorId, isAdmin }) => {
      let query = supabase.from('posts').delete().eq('id', postId);
      // If not admin, restrict to own posts via RLS
      if (!isAdmin) {
        query = query.eq('author_id', authorId);
      }
      const { error } = await query;
      if (error) throw error;
      return { postId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
