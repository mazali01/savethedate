import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createInvitedUser,
  getInvitedUsers,
  updateInvitedUser,
  deleteInvitedUser
} from '../services/invitedUsersService';

// Query Keys
export const INVITED_USERS_QUERY_KEYS = {
  users: ['invitedUsers'],
  user: (userId) => ['invitedUsers', userId],
};

// Query Hooks
export const useInvitedUsers = () => {
  return useQuery({
    queryKey: INVITED_USERS_QUERY_KEYS.users,
    queryFn: getInvitedUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

// Mutation Hooks
export const useCreateInvitedUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvitedUser,
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: INVITED_USERS_QUERY_KEYS.users });
    },
  });
};

export const useUpdateInvitedUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, userData }) => updateInvitedUser(userId, userData),
    onSuccess: (data, { userId }) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: INVITED_USERS_QUERY_KEYS.users });
      // Update specific user cache if it exists
      queryClient.setQueryData(INVITED_USERS_QUERY_KEYS.user(userId), data);
    },
  });
};

export const useDeleteInvitedUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInvitedUser,
    onSuccess: (data, userId) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: INVITED_USERS_QUERY_KEYS.users });
      // Remove from specific user cache
      queryClient.removeQueries({ queryKey: INVITED_USERS_QUERY_KEYS.user(userId) });
    },
  });
};
