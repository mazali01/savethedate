import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCarpoolOffer,
  getCarpoolOffers,
  getUserCarpoolOffers,
  updateCarpoolOffer,
  deleteCarpoolOffer,
  addPassengerToOffer,
  removePassengerFromOffer,
  createCarpoolRequest,
  getCarpoolRequests,
  getUserCarpoolRequests,
  updateCarpoolRequest,
  deleteCarpoolRequest,
  subscribeToCarpoolOffers,
  subscribeToCarpoolRequests
} from '../services/carpoolService';

// Query Keys
export const CARPOOL_QUERY_KEYS = {
  offers: ['carpool', 'offers'],
  userOffers: (userId) => ['carpool', 'offers', 'user', userId],
  requests: ['carpool', 'requests'],
  userRequests: (userId) => ['carpool', 'requests', 'user', userId],
};

// Query Hooks
export const useCarpoolOffers = () => {
  return useQuery({
    queryKey: CARPOOL_QUERY_KEYS.offers,
    queryFn: getCarpoolOffers,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });
};

export const useUserCarpoolOffers = (userId) => {
  return useQuery({
    queryKey: CARPOOL_QUERY_KEYS.userOffers(userId),
    queryFn: () => getUserCarpoolOffers(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });
};

export const useCarpoolRequests = () => {
  return useQuery({
    queryKey: CARPOOL_QUERY_KEYS.requests,
    queryFn: getCarpoolRequests,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });
};

export const useUserCarpoolRequests = (userId) => {
  return useQuery({
    queryKey: CARPOOL_QUERY_KEYS.userRequests(userId),
    queryFn: () => getUserCarpoolRequests(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });
};

// Realtime subscription hook for offers
export const useCarpoolOffersSubscription = (callback) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [...CARPOOL_QUERY_KEYS.offers, 'subscription'],
    queryFn: () => {
      // This is a dummy function - the real subscription is handled in the effect
      return Promise.resolve([]);
    },
    enabled: false, // Don't run the query function
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    // Use onMount to set up the subscription
    onMount: () => {
      const unsubscribe = subscribeToCarpoolOffers((offers) => {
        // Update the main offers query cache
        queryClient.setQueryData(CARPOOL_QUERY_KEYS.offers, offers);
        // Call the optional callback
        if (callback) callback(offers);
      });

      return () => unsubscribe();
    }
  });
};

// Realtime subscription hook for requests
export const useCarpoolRequestsSubscription = (callback) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [...CARPOOL_QUERY_KEYS.requests, 'subscription'],
    queryFn: () => {
      return Promise.resolve([]);
    },
    enabled: false,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    onMount: () => {
      const unsubscribe = subscribeToCarpoolRequests((requests) => {
        queryClient.setQueryData(CARPOOL_QUERY_KEYS.requests, requests);
        if (callback) callback(requests);
      });

      return () => unsubscribe();
    }
  });
};

// Mutation Hooks
export const useCreateCarpoolOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCarpoolOffer,
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: CARPOOL_QUERY_KEYS.offers });
      queryClient.invalidateQueries({ queryKey: CARPOOL_QUERY_KEYS.userOffers(variables.userId) });
    },
  });
};

export const useUpdateCarpoolOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offerId, updateData }) => updateCarpoolOffer(offerId, updateData),
    onSuccess: () => {
      // Invalidate all carpool offer queries
      queryClient.invalidateQueries({ queryKey: CARPOOL_QUERY_KEYS.offers });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'carpool' &&
          query.queryKey[1] === 'offers'
      });
    },
  });
};

export const useDeleteCarpoolOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCarpoolOffer,
    onSuccess: () => {
      // Invalidate all carpool offer queries
      queryClient.invalidateQueries({ queryKey: CARPOOL_QUERY_KEYS.offers });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'carpool' &&
          query.queryKey[1] === 'offers'
      });
    },
  });
};

export const useAddPassengerToOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offerId, passengerData }) => addPassengerToOffer(offerId, passengerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARPOOL_QUERY_KEYS.offers });
    },
  });
};

export const useRemovePassengerFromOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offerId, passengerData }) => removePassengerFromOffer(offerId, passengerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARPOOL_QUERY_KEYS.offers });
    },
  });
};

export const useCreateCarpoolRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCarpoolRequest,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: CARPOOL_QUERY_KEYS.requests });
      queryClient.invalidateQueries({ queryKey: CARPOOL_QUERY_KEYS.userRequests(variables.userId) });
    },
  });
};

export const useUpdateCarpoolRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, updateData }) => updateCarpoolRequest(requestId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARPOOL_QUERY_KEYS.requests });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'carpool' &&
          query.queryKey[1] === 'requests'
      });
    },
  });
};

export const useDeleteCarpoolRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCarpoolRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARPOOL_QUERY_KEYS.requests });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'carpool' &&
          query.queryKey[1] === 'requests'
      });
    },
  });
};
