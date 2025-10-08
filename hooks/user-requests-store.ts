import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { UserRequest, RequestStatus, RequestType } from '@/types/user-request';

const STORAGE_KEY = 'hudson_user_requests';

export const [UserRequestsProvider, useUserRequests] = createContextHook(() => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRequests(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load user requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const saveRequests = useCallback(async (newRequests: UserRequest[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRequests));
      setRequests(newRequests);
    } catch (error) {
      console.error('Failed to save user requests:', error);
    }
  }, []);

  const createRequest = useCallback(async (request: Omit<UserRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const newRequest: UserRequest = {
      ...request,
      id: `req-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveRequests([...requests, newRequest]);
    return newRequest;
  }, [requests, saveRequests]);

  const updateRequest = useCallback(async (requestId: string, updates: Partial<UserRequest>) => {
    const updatedRequests = requests.map(req =>
      req.id === requestId
        ? { ...req, ...updates, updatedAt: new Date().toISOString() }
        : req
    );
    await saveRequests(updatedRequests);
  }, [requests, saveRequests]);

  const updateRequestStatus = useCallback(async (
    requestId: string,
    status: RequestStatus,
    reviewedBy: string,
    reviewedByName: string,
    reviewNotes?: string
  ) => {
    const updates: Partial<UserRequest> = {
      status,
      reviewedBy,
      reviewedByName,
      reviewedAt: new Date().toISOString(),
      reviewNotes,
    };

    if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
    }

    await updateRequest(requestId, updates);
  }, [updateRequest]);

  const assignTech = useCallback(async (requestId: string, techId: string, techName: string) => {
    await updateRequest(requestId, {
      assignedTechId: techId,
      assignedTechName: techName,
    });
  }, [updateRequest]);

  const deleteRequest = useCallback(async (requestId: string) => {
    const updatedRequests = requests.filter(req => req.id !== requestId);
    await saveRequests(updatedRequests);
  }, [requests, saveRequests]);

  const getRequestsByProperty = useCallback((propertyId: string) => {
    return requests.filter(req => req.propertyId === propertyId);
  }, [requests]);

  const getRequestsByUser = useCallback((userId: string) => {
    return requests.filter(req => req.userId === userId);
  }, [requests]);

  const getRequestsByStatus = useCallback((status: RequestStatus) => {
    return requests.filter(req => req.status === status);
  }, [requests]);

  const getRequestsByType = useCallback((type: RequestType) => {
    return requests.filter(req => req.type === type);
  }, [requests]);

  const getPendingRequests = useCallback(() => {
    return requests.filter(req => req.status === 'pending');
  }, [requests]);

  const getRequestStats = useCallback(() => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      inReview: requests.filter(r => r.status === 'in-review').length,
      approved: requests.filter(r => r.status === 'approved').length,
      completed: requests.filter(r => r.status === 'completed').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      byType: {
        customService: requests.filter(r => r.type === 'custom_service').length,
        blueprintModification: requests.filter(r => r.type === 'blueprint_modification').length,
        maintenanceSupport: requests.filter(r => r.type === 'maintenance_support').length,
        generalInquiry: requests.filter(r => r.type === 'general_inquiry').length,
      },
    };
  }, [requests]);

  return useMemo(() => ({
    requests,
    isLoading,
    createRequest,
    updateRequest,
    updateRequestStatus,
    assignTech,
    deleteRequest,
    getRequestsByProperty,
    getRequestsByUser,
    getRequestsByStatus,
    getRequestsByType,
    getPendingRequests,
    getRequestStats,
  }), [
    requests,
    isLoading,
    createRequest,
    updateRequest,
    updateRequestStatus,
    assignTech,
    deleteRequest,
    getRequestsByProperty,
    getRequestsByUser,
    getRequestsByStatus,
    getRequestsByType,
    getPendingRequests,
    getRequestStats,
  ]);
});
