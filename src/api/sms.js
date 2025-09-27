import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  testSMSSending,
  checkSMSBalance,
  checkSMSConfiguration,
  sendSMS,
  sendBulkSMS,
  generateInvitationLink,
  generateBulkInvitationLinks,
  copyLinkToClipboard,
  formatPhoneForSMS4Free,
  isValidPhoneNumber,
  formatPhoneNumber
} from '../services/smsService';

// Query Keys
export const SMS_QUERY_KEYS = {
  balance: ['sms', 'balance'],
  configuration: ['sms', 'configuration'],
};

// Query Hooks
export const useSMSBalance = () => {
  return useQuery({
    queryKey: SMS_QUERY_KEYS.balance,
    queryFn: checkSMSBalance,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false, // Balance doesn't change frequently
  });
};

export const useSMSConfiguration = () => {
  return useQuery({
    queryKey: SMS_QUERY_KEYS.configuration,
    queryFn: checkSMSConfiguration,
    staleTime: 1000 * 60 * 30, // 30 minutes - configuration rarely changes
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Mutation Hooks
export const useTestSMS = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: testSMSSending,
    onSuccess: () => {
      // Refetch balance after sending test SMS
      queryClient.invalidateQueries({ queryKey: SMS_QUERY_KEYS.balance });
    },
  });
};

export const useSendSMS = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ phoneNumber, message }) => sendSMS(phoneNumber, message),
    onSuccess: () => {
      // Refetch balance after sending SMS
      queryClient.invalidateQueries({ queryKey: SMS_QUERY_KEYS.balance });
    },
  });
};

export const useSendBulkSMS = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invitations, onProgress }) => sendBulkSMS(invitations, onProgress),
    onSuccess: () => {
      // Refetch balance after bulk SMS
      queryClient.invalidateQueries({ queryKey: SMS_QUERY_KEYS.balance });
    },
  });
};

export const useCopyToClipboard = () => {
  return useMutation({
    mutationFn: copyLinkToClipboard,
  });
};

// Utility hooks (these don't make API calls but are useful)
export const useGenerateInvitationLink = () => {
  return {
    generateLink: generateInvitationLink,
    generateBulkLinks: generateBulkInvitationLinks,
  };
};

export const usePhoneNumberUtils = () => {
  return {
    formatForSMS: formatPhoneForSMS4Free,
    isValid: isValidPhoneNumber,
    formatForDisplay: formatPhoneNumber,
  };
};
