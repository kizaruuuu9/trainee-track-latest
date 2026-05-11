import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

const fetchPosts = async (limit = 20) => {
  const { data, error } = await supabase
    .from('posts')
    .select('id, author_id, author_type, post_type, title, content, media_url, tags, is_active, created_at, updated_at, expires_at, schedule, time_range, slots, requirements, status, accept_referrals, admin_metadata, program_name, image_url, attachment_name, attachment_url, attachment_type')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const usePosts = (limit = 20, options = {}) => {
  return useQuery({
    queryKey: queryKeys.posts(limit),
    queryFn: () => fetchPosts(limit),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};
