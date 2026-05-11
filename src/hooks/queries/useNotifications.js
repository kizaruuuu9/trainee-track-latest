import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

const fetchNotifications = async (userId) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, text, read, created_at, metadata')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    if (error.code === '42P01') {
      console.warn('notifications table not found.');
      return [];
    }
    throw error;
  }

  return data || [];
};

export const useNotifications = (userId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.notifications(userId),
    queryFn: () => fetchNotifications(userId),
    staleTime: 60 * 1000, // 1 minute
    enabled: !!userId,
    ...options,
  });
};
