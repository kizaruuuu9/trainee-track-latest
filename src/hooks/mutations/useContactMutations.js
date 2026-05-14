import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';
import toast from 'react-hot-toast';

export const useSendContactRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session has expired. Please log in again.');

      const payload = {
        sender_id: session.user.id,
        sender_type: requestData.senderType || 'student',
        recipient_id: requestData.recipientId,
        recipient_type: requestData.recipientType || 'industry_partner',
        message: requestData.message,
        job_posting_id: requestData.jobPostingId || null,
        post_id: requestData.postId || null,
        attachment_name: requestData.attachmentName || null,
        attachment_url: requestData.attachmentUrl || null,
        attachment_kind: requestData.attachmentKind || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('contact_requests')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate for both sender and recipient to ensure UI parity
      if (data.sender_id) queryClient.invalidateQueries({ queryKey: queryKeys.contactRequests(data.sender_id) });
      if (data.recipient_id) queryClient.invalidateQueries({ queryKey: queryKeys.contactRequests(data.recipient_id) });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};
