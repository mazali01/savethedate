import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  uploadMediaFile,
  createBlessing,
  getPaginatedBlessings,
  getPublicBlessings,
  getUserBlessings,
  addReaction,
  removeReaction,
  deleteBlessing,
  upsertUser,
  updateBlessingPrivacy
} from '../services/giftService';

// Query Keys
export const GIFTS_QUERY_KEYS = {
  blessings: ['blessings'],
  paginatedBlessings: ['blessings', 'paginated'],
  userBlessings: (userId) => ['blessings', 'user', userId],
};

// Query Hooks
export const usePublicBlessings = () => {
  return useQuery({
    queryKey: GIFTS_QUERY_KEYS.blessings,
    queryFn: getPublicBlessings,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });
};

export const usePaginatedBlessings = (userId = null) => {
  return useInfiniteQuery({
    queryKey: [...GIFTS_QUERY_KEYS.paginatedBlessings, userId],
    queryFn: ({ pageParam = null }) => getPaginatedBlessings(10, pageParam, userId),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.lastDocId : undefined;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });
};

export const useUserBlessings = (userId) => {
  return useQuery({
    queryKey: GIFTS_QUERY_KEYS.userBlessings(userId),
    queryFn: () => getUserBlessings(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });
};

// Mutation Hooks
export const useUploadMediaFile = () => {
  return useMutation({
    mutationFn: ({ file, folder = 'blessings' }) => uploadMediaFile(file, folder),
  });
};

export const useCreateBlessing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBlessing,
    onSuccess: () => {
      // Invalidate and refetch blessings
      queryClient.invalidateQueries({ queryKey: GIFTS_QUERY_KEYS.blessings });
      queryClient.invalidateQueries({ queryKey: GIFTS_QUERY_KEYS.paginatedBlessings });
    },
  });
};

export const useAddReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ blessingId, userId, username, emoji, emojis }) =>
      addReaction(blessingId, userId, username, emojis || emoji),
    onSuccess: () => {
      // Invalidate and refetch blessings to show updated reactions
      queryClient.invalidateQueries({ queryKey: GIFTS_QUERY_KEYS.blessings });
      queryClient.invalidateQueries({ queryKey: GIFTS_QUERY_KEYS.paginatedBlessings });
    },
  });
};

export const useRemoveReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ blessingId, userId }) => removeReaction(blessingId, userId),
    onSuccess: () => {
      // Invalidate and refetch blessings to show updated reactions
      queryClient.invalidateQueries({ queryKey: GIFTS_QUERY_KEYS.blessings });
      queryClient.invalidateQueries({ queryKey: GIFTS_QUERY_KEYS.paginatedBlessings });
    },
  });
};

export const useDeleteBlessing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ blessingId, userId }) => deleteBlessing(blessingId, userId),
    onSuccess: () => {
      // Invalidate and refetch blessings to remove deleted blessing
      queryClient.invalidateQueries({ queryKey: GIFTS_QUERY_KEYS.blessings });
      queryClient.invalidateQueries({ queryKey: GIFTS_QUERY_KEYS.paginatedBlessings });
    },
  });
};

export const useUpsertUser = () => {
  return useMutation({
    mutationFn: ({ userId, userData }) => upsertUser(userId, userData),
  });
};

export const useUpdateBlessingPrivacy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ blessingId, isPublic }) => updateBlessingPrivacy(blessingId, isPublic),
    onSuccess: () => {
      // Invalidate and refetch blessings to show updated privacy status
      queryClient.invalidateQueries({ queryKey: GIFTS_QUERY_KEYS.blessings });
      queryClient.invalidateQueries({ queryKey: GIFTS_QUERY_KEYS.paginatedBlessings });
    },
  });
};
