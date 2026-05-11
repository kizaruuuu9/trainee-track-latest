import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

const isSchemaMissingError = (error) => ['42P01', 'PGRST205'].includes(error?.code);
const isColumnShapeError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return ['PGRST204', '42703'].includes(error?.code) || message.includes('column');
};

const fetchContactRequests = async (userId, userRole) => {
  if (!userId || typeof userId !== 'string' || userId.length !== 36) return [];
  if (userRole === 'admin') return [];

  const { data, error } = await supabase
    .from('contact_requests')
    .select('id, post_id, job_posting_id, sender_id, sender_type, recipient_id, recipient_type, message, attachment_name, attachment_url, attachment_kind, created_at, status, notes, reviewed_at')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    if (isSchemaMissingError(error) || isColumnShapeError(error)) {
      console.warn('contact_requests table not available.');
      return [];
    }
    throw error;
  }

  return (data || []).map(r => ({ ...r, sourceTable: 'contact_requests', recordType: 'contact' }));
};

export const useContactRequests = (userId, userRole, options = {}) => {
  return useQuery({
    queryKey: queryKeys.contactRequests(userId),
    queryFn: () => fetchContactRequests(userId, userRole),
    staleTime: 60 * 1000,
    enabled: !!userId && typeof userId === 'string' && userId.length === 36 && userRole !== 'admin',
    ...options,
  });
};
