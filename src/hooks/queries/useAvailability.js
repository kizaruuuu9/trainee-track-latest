import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

const fetchAvailability = async (partnerId) => {
  if (!partnerId) return [];

  const { data, error } = await supabase
    .from('partner_availability')
    .select('id, partner_id, day_of_week, start_time, end_time, capacity')
    .eq('partner_id', partnerId)
    .order('day_of_week', { ascending: true });

  if (error) {
    if (error.code === '42P01') {
      console.warn('partner_availability table not found.');
      return [];
    }
    throw error;
  }

  return data || [];
};

export const useAvailability = (partnerId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.availability(partnerId),
    queryFn: () => fetchAvailability(partnerId),
    enabled: !!partnerId,
    ...options,
  });
};
