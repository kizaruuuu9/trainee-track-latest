// Barrel export for all query hooks
export { usePosts } from './queries/usePosts';
export { useJobPostings } from './queries/useJobPostings';
export { useApplications } from './queries/useApplications';
export { useNotifications } from './queries/useNotifications';
export { usePrograms } from './queries/usePrograms';
export { usePostInteractions } from './queries/usePostInteractions';
export { useContactRequests } from './queries/useContactRequests';
export { useTrainees } from './queries/useTrainees';
export { usePartners } from './queries/usePartners';
export { useInterviewBookings } from './queries/useInterviewBookings';
export { useAvailability } from './queries/useAvailability';
export { useAdminDirectory } from './queries/useAdminDirectory';

// Barrel export for all mutation hooks
export { useCreatePost, useUpdatePost, useDeletePost } from './mutations/usePostMutations';
export { useApplyToJob } from './mutations/useApplyToJob';
export { useUpdateApplicationStatus } from './mutations/useUpdateApplicationStatus';
export { useCreatePostInteraction } from './mutations/useCreatePostInteraction';
export { useMarkNotificationRead, useMarkAllNotificationsRead, useClearAllNotifications } from './mutations/useNotificationMutations';
export { useUpdateTrainee, useToggleBookmark } from './mutations/useTraineeMutations';
export { useDeleteApplication } from './mutations/useDeleteApplication';
export { useSaveInterviewBooking } from './mutations/useSaveInterviewBooking';
export { useSendContactRequest } from './mutations/useContactMutations';
export { useSaveAvailabilitySlot, useDeleteAvailabilitySlot } from './mutations/useAvailabilityMutations';
