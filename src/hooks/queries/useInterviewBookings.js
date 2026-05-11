import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

const fetchInterviewBookings = async (userId, userRole) => {
  if (!userId) return [];

  const column = userRole === 'partner' ? 'partner_id' : 'trainee_id';
  
  const { data, error } = await supabase
    .from('interview_bookings')
    .select('id, application_id, trainee_id, partner_id, start_time, end_time, status, created_at')
    .eq(column, userId)
    .order('start_time', { ascending: true });

  if (error) {
    if (error.code === '42P01') {
      console.warn('interview_bookings table not found.');
      return [];
    }
    throw error;
  }

  return data || [];
};

export const useInterviewBookings = (userId, userRole, options = {}) => {
  const queryKey = userRole === 'partner' 
    ? queryKeys.bookings(userId) 
    : queryKeys.traineeBookings(userId);

  return useQuery({
    queryKey,
    queryFn: () => fetchInterviewBookings(userId, userRole),
    enabled: !!userId,
    ...options,
  });
};
