import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const useSaveInterviewBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData) => {
      const appId = bookingData.application_id || bookingData.applicationId;
      const traineeId = bookingData.trainee_id || bookingData.traineeId;
      const partnerId = bookingData.partner_id || bookingData.partnerId;

      const payload = {
        application_id: appId,
        trainee_id: traineeId,
        partner_id: partnerId,
        start_time: bookingData.start_time || bookingData.startTime,
        end_time: bookingData.end_time || bookingData.endTime,
        status: bookingData.status || 'scheduled',
      };

      const { data, error } = await supabase
        .from('interview_bookings')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewBookings'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Interview scheduled');
    },
    onError: (error) => {
      toast.error(`Scheduling failed: ${error.message}`);
    }
  });
};
