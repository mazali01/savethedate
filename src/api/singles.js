import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSinglesProfile,
  getSinglesProfiles,
  getSinglesProfile,
  updateSinglesProfile,
  deleteSinglesProfile,
  uploadProfilePhoto,
  hasSinglesProfile,
  getMatchingSinglesProfiles
} from '../services/singlesService';

// Query Keys
export const SINGLES_QUERY_KEYS = {
  profiles: ['singles', 'profiles'],
  profile: (userId) => ['singles', 'profile', userId],
  hasProfile: (userId) => ['singles', 'hasProfile', userId],
  matches: (userGender, userInterestedIn, userId) => [
    'singles',
    'matches',
    userGender,
    userInterestedIn,
    userId
  ],
};

// Query Hooks
export const useSinglesProfiles = () => {
  return useQuery({
    queryKey: SINGLES_QUERY_KEYS.profiles,
    queryFn: getSinglesProfiles,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

export const useSinglesProfile = (userId) => {
  return useQuery({
    queryKey: SINGLES_QUERY_KEYS.profile(userId),
    queryFn: () => getSinglesProfile(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes - profile data doesn't change frequently
    retry: 2,
  });
};

export const useHasSinglesProfile = (userId) => {
  return useQuery({
    queryKey: SINGLES_QUERY_KEYS.hasProfile(userId),
    queryFn: () => hasSinglesProfile(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });
};

export const useMatchingSinglesProfiles = (userGender, userInterestedIn, userId) => {
  return useQuery({
    queryKey: SINGLES_QUERY_KEYS.matches(userGender, userInterestedIn, userId),
    queryFn: () => getMatchingSinglesProfiles(userGender, userInterestedIn, userId),
    enabled: !!(userGender && userInterestedIn && userId),
    staleTime: 1000 * 60 * 3, // 3 minutes - matching profiles can change
    retry: 2,
  });
};

// Mutation Hooks
export const useCreateSinglesProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSinglesProfile,
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: SINGLES_QUERY_KEYS.profiles });
      queryClient.invalidateQueries({ queryKey: SINGLES_QUERY_KEYS.profile(data.userId) });
      queryClient.invalidateQueries({ queryKey: SINGLES_QUERY_KEYS.hasProfile(data.userId) });

      // Update cache directly for immediate feedback
      queryClient.setQueryData(SINGLES_QUERY_KEYS.profile(data.userId), data);
      queryClient.setQueryData(SINGLES_QUERY_KEYS.hasProfile(data.userId), true);
    },
  });
};

export const useUpdateSinglesProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updateData }) => updateSinglesProfile(userId, updateData),
    onSuccess: (data, { userId }) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: SINGLES_QUERY_KEYS.profiles });
      queryClient.invalidateQueries({ queryKey: SINGLES_QUERY_KEYS.profile(userId) });

      // Invalidate matching queries as profile changes might affect matches
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'singles' && query.queryKey[1] === 'matches'
      });
    },
  });
};

export const useDeleteSinglesProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSinglesProfile,
    onSuccess: (data, userId) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: SINGLES_QUERY_KEYS.profiles });
      queryClient.invalidateQueries({ queryKey: SINGLES_QUERY_KEYS.profile(userId) });
      queryClient.setQueryData(SINGLES_QUERY_KEYS.hasProfile(userId), false);

      // Invalidate matching queries
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'singles' && query.queryKey[1] === 'matches'
      });
    },
  });
};

export const useUploadProfilePhoto = () => {
  return useMutation({
    mutationFn: ({ file, userId }) => uploadProfilePhoto(file, userId),
  });
};
