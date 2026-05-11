import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';
import toast from 'react-hot-toast';

export const useUpdateTrainee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ traineeId, updates }) => {
      // Map dashboard field names to students table column names if necessary
      const dbUpdates = {
        full_name: updates.name,
        profile_name: updates.profileName,
        profile_picture_url: updates.photo,
        contact_email: updates.email,
        bio: updates.bio,
        skills: updates.skills,
        nc_level: updates.ncLevel,
        personal_info_visibility: updates.personalInfoVisibility,
        bookmarks: updates.bookmarks,
        // Add other fields as needed
      };

      // Filter out undefined fields
      const cleanUpdates = Object.fromEntries(
        Object.entries(dbUpdates).filter(([_, v]) => v !== undefined)
      );

      const { data, error } = await supabase
        .from('students')
        .update(cleanUpdates)
        .eq('id', traineeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trainees'] });
      // Also invalidate currentUser if it's the same trainee
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    }
  });
};

export const useToggleBookmark = () => {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateTrainee();

  return useMutation({
    mutationFn: async ({ trainee, jobId }) => {
      const bookmarks = Array.isArray(trainee.bookmarks) ? trainee.bookmarks : [];
      const isBookmarked = bookmarks.includes(jobId);
      
      const newBookmarks = isBookmarked
        ? bookmarks.filter(id => id !== jobId)
        : [...bookmarks, jobId];

      return updateMutation.mutateAsync({
        traineeId: trainee.id,
        updates: { bookmarks: newBookmarks }
      });
    },
    onSuccess: (_, variables) => {
      const isBookmarked = (variables.trainee.bookmarks || []).includes(variables.jobId);
      toast.success(isBookmarked ? 'Bookmark removed' : 'Job bookmarked');
    }
  });
};
