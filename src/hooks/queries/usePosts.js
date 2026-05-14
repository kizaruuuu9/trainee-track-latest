import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

const fetchPosts = async ({ limit = 20, ids = null } = {}) => {
  // If ids is an empty array, return empty results immediately
  if (ids !== null && ids.length === 0) return [];

  let query = supabase
    .from('posts')
    .select('id, author_id, author_type, post_type, title, content, media_url, tags, is_active, created_at, updated_at, expires_at, schedule, time_range, slots, requirements, status, accept_referrals, admin_metadata, program_name, image_url, attachment_name, attachment_url, attachment_type')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (ids && ids.length > 0) {
    const cleanIds = ids.filter(Boolean);
    if (cleanIds.length === 0) return [];
    query = query.in('id', cleanIds);
  } else {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const usePosts = (params = 20, options = {}) => {
  const isObject = typeof params === 'object' && params !== null;
  const limit = isObject ? (params.limit || 40) : (params || 40);
  const ids = isObject ? params.ids : null;

  return useQuery({
    queryKey: queryKeys.posts(isObject ? params : limit),
    queryFn: () => fetchPosts({ limit, ids }),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};
