import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

const fetchPostInteractions = async ({ postId = null, userId = null } = {}) => {
  let query = supabase
    .from('post_interactions')
    .select('id, post_id, user_id, interaction_type, status, details, created_at, updated_at, user_type')
    .order('created_at', { ascending: false })
    .limit(40);

  if (postId) query = query.eq('post_id', postId);
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;

  if (error) {
    if (error.code === '42P01') {
      console.warn('post_interactions table not found.');
      return [];
    }
    throw error;
  }

  return data || [];
};

export const usePostInteractions = (params = {}, options = {}) => {
  const { postId, userId } = params;
  return useQuery({
    queryKey: queryKeys.postInteractions(postId || userId || 'all'),
    queryFn: () => fetchPostInteractions({ postId, userId }),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};
