import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';

export const useCreatePostInteraction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId, userType, interactionType, details, existingInteractions }) => {
      // For 'save' interaction, toggle if already exists
      if (interactionType === 'save' && existingInteractions) {
        const existing = existingInteractions.find(
          i => i.post_id === postId && i.user_id === userId && i.interaction_type === 'save'
        );
        if (existing) {
          const { error } = await supabase.from('post_interactions').delete().eq('id', existing.id);
          if (error) throw error;
          return { action: 'removed', id: existing.id };
        }
      }

      const payload = {
        post_id: postId,
        user_id: userId,
        user_type: userType,
        interaction_type: interactionType,
        status: 'pending',
        details: details || {},
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('post_interactions')
        .insert([payload])
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') throw new Error('post_interactions table not found.');
        throw error;
      }

      return { action: 'added', data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postInteractions'] });
    },
  });
};
