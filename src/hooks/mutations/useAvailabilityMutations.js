import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';
import toast from 'react-hot-toast';

export const useSaveAvailabilitySlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partnerId, slot }) => {
      const payload = {
        partner_id: partnerId,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        capacity: slot.capacity || 1
      };

      const { data, error } = await supabase
        .from('partner_availability')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { partnerId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availability(partnerId) });
      toast.success('Availability slot saved');
    },
    onError: (error) => {
      toast.error(`Failed to save slot: ${error.message}`);
    }
  });
};

export const useDeleteAvailabilitySlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId }) => {
      const { error } = await supabase
        .from('partner_availability')
        .delete()
        .eq('id', slotId);

      if (error) throw error;
      return slotId;
    },
    onSuccess: (_, variables) => {
      // Note: We might not have partnerId here unless passed in variables
      // But we can invalidate all availability queries or just the specific one if we had partnerId
      if (variables.partnerId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.availability(variables.partnerId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ['availability'] });
      }
      toast.success('Availability slot removed');
    },
    onError: (error) => {
      toast.error(`Failed to delete slot: ${error.message}`);
    }
  });
};
