import { QueryClient } from '@tanstack/react-query';

// FREE TIER OPTIMIZED QueryClient Configuration
// - staleTime: 2min — prevents re-fetches when switching dashboard tabs
// - gcTime: 10min — keeps cache alive longer to avoid redundant calls
// - refetchOnWindowFocus: false — prevents Supabase call on every alt-tab
// - refetchInterval: false — no polling; we rely on Supabase Realtime
// - retry: 1 — avoids hammering the DB on transient errors
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      refetchInterval: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Centralized query key factory — prevents typos and enables targeted invalidation
export const queryKeys = {
  // Posts & Feed
  posts: (limit) => ['posts', limit ?? 20],
  jobPostings: (limit) => ['jobPostings', limit ?? 20],
  jobPostingComments: () => ['jobPostingComments'],
  postInteractions: (postId) => postId ? ['postInteractions', postId] : ['postInteractions'],

  // Users & Directory
  programs: () => ['programs'],
  adminDirectory: (page, search) => ['admin', 'directory', page ?? 0, search ?? ''],
  publicDirectory: () => ['publicDirectory'],

  // Applications & Recruitment
  applications: (userId) => ['applications', userId],
  contactRequests: (userId) => ['contactRequests', userId],
  bookings: (partnerId) => ['bookings', partnerId],
  traineeBookings: (traineeId) => ['traineeBookings', traineeId],

  // Notifications
  notifications: (userId) => ['notifications', userId],

  // Scheduling
  availability: (partnerId) => ['availability', partnerId],

  // Reference Data (long cache)
  pqf: () => ['pqf'],
  systemSettings: () => ['systemSettings'],
};
