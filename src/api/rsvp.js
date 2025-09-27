import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInvitedUserById,
  getRsvpResponse,
  submitRsvpResponse,
  updateRsvpResponse,
  getAllRsvpResponses,
  hasCompletedRsvp,
  generateCalendarEvent,
  generateCalendarLinks
} from '../services/rsvpService';

// Query Keys
export const RSVP_QUERY_KEYS = {
  user: (userId) => ['user', userId],
  rsvp: (userId) => ['rsvp', userId],
  allRsvps: ['rsvp', 'all'],
  hasCompleted: (userId) => ['rsvp', 'completed', userId],
};

// Query Hooks
export const useInvitedUser = (userId) => {
  return useQuery({
    queryKey: RSVP_QUERY_KEYS.user(userId),
    queryFn: () => getInvitedUserById(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes - user data rarely changes
    retry: 2,
  });
};

export const useRsvpResponse = (userId) => {
  return useQuery({
    queryKey: RSVP_QUERY_KEYS.rsvp(userId),
    queryFn: () => getRsvpResponse(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes - RSVP can change more frequently
    retry: 2,
  });
};

export const useAllRsvpResponses = () => {
  return useQuery({
    queryKey: RSVP_QUERY_KEYS.allRsvps,
    queryFn: getAllRsvpResponses,
    staleTime: 1000 * 60 * 2, // 2 minutes for admin data
    retry: 2,
  });
};

export const useHasCompletedRsvp = (userId) => {
  return useQuery({
    queryKey: RSVP_QUERY_KEYS.hasCompleted(userId),
    queryFn: () => hasCompletedRsvp(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

// Combined hook for loading both user and RSVP data
export const useRsvpPageData = (userId) => {
  const userQuery = useInvitedUser(userId);
  const rsvpQuery = useRsvpResponse(userId);

  return {
    user: userQuery.data,
    existingRsvp: rsvpQuery.data,
    isLoading: userQuery.isLoading || rsvpQuery.isLoading,
    isError: userQuery.isError || rsvpQuery.isError,
    error: userQuery.error || rsvpQuery.error,
    userError: userQuery.error,
    rsvpError: rsvpQuery.error,
    isUserLoading: userQuery.isLoading,
    isRsvpLoading: rsvpQuery.isLoading,
    refetch: () => {
      userQuery.refetch();
      rsvpQuery.refetch();
    }
  };
};

// Mutation Hooks
export const useSubmitRsvp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, rsvpData }) => submitRsvpResponse(userId, rsvpData),
    onSuccess: (data, { userId }) => {
      // Invalidate and refetch RSVP query to ensure UI is up to date
      queryClient.invalidateQueries({ queryKey: RSVP_QUERY_KEYS.rsvp(userId) });
      queryClient.invalidateQueries({ queryKey: RSVP_QUERY_KEYS.hasCompleted(userId) });
      queryClient.invalidateQueries({ queryKey: RSVP_QUERY_KEYS.allRsvps });

      // Optionally update the cache directly for immediate UI feedback
      queryClient.setQueryData(RSVP_QUERY_KEYS.rsvp(userId), data);
    },
  });
};

export const useUpdateRsvp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updateData }) => updateRsvpResponse(userId, updateData),
    onSuccess: (data, { userId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: RSVP_QUERY_KEYS.rsvp(userId) });
      queryClient.invalidateQueries({ queryKey: RSVP_QUERY_KEYS.allRsvps });
    },
  });
};

// Utility functions (no API calls, but useful for calendar functionality)
export const useCalendarEvent = (eventDetails) => {
  return generateCalendarEvent(eventDetails);
};

export const useCalendarLinks = (eventData) => {
  return generateCalendarLinks(eventData);
};
