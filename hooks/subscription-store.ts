import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Subscription, HudsonVisit, MyHomeBlueprint, MyHomeScore, CustomProject, MonthlyVisitRequest, SnapshotInspection, RoomInspection } from '@/types/subscription';
import { getMonthlyTasks } from '@/constants/maintenance-tasks';

const STORAGE_KEY = 'hudson_subscriptions';

const generateMockVisits = (propertyId: string): HudsonVisit[] => {
  const visits: HudsonVisit[] = [];
  const now = new Date();
  
  for (let i = 0; i < 6; i++) {
    const visitDate = new Date(now);
    visitDate.setMonth(now.getMonth() - i);
    
    const month = visitDate.getMonth() + 1;
    const tasks = getMonthlyTasks(month).map((task, idx) => ({
      ...task,
      id: `task-${i}-${idx}`,
      completed: i > 0,
    }));
    
    visits.push({
      id: `visit-${i}`,
      propertyId,
      scheduledDate: visitDate.toISOString(),
      completedDate: i > 0 ? visitDate.toISOString() : undefined,
      status: i === 0 ? 'scheduled' : 'completed',
      type: 'monthly-maintenance',
      hudsonName: 'James Mitchell',
      tasks,
      notes: i > 0 ? 'All tasks completed successfully. Property in excellent condition.' : undefined,
      nextVisitDate: i === 0 ? new Date(visitDate.setMonth(visitDate.getMonth() + 1)).toISOString() : undefined,
    });
  }
  
  return visits.reverse();
};

const generateMockScore = (propertyId: string): MyHomeScore => {
  const now = new Date();
  const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;
  
  return {
    id: `score-${Date.now()}`,
    propertyId,
    score: 87,
    quarter,
    year: now.getFullYear(),
    categories: {
      structural: 90,
      mechanical: 85,
      aesthetic: 88,
      efficiency: 82,
      safety: 95,
    },
    improvements: [
      'HVAC system efficiency improved by 15%',
      'Resolved minor plumbing issues',
      'Enhanced outdoor lighting',
    ],
    recommendations: [
      'Consider upgrading to smart thermostat',
      'Schedule gutter cleaning before winter',
      'Plan for deck refinishing next spring',
    ],
    createdAt: now.toISOString(),
  };
};

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [subscriptions, setSubscriptions] = useState<Record<string, Subscription>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscriptions = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        setSubscriptions(JSON.parse(stored));
      } else {
        setSubscriptions({});
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      setSubscriptions({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const saveSubscriptions = useCallback(async (newSubscriptions: Record<string, Subscription>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSubscriptions));
      setSubscriptions(newSubscriptions);
    } catch (error) {
      console.error('Failed to save subscriptions:', error);
    }
  }, []);

  const getSubscription = useCallback((propertyId: string): Subscription | null => {
    return subscriptions[propertyId] || null;
  }, [subscriptions]);

  const createSubscription = useCallback(async (propertyId: string) => {
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(now.getMonth() + 1);
    
    const newSubscription: Subscription = {
      id: `sub-${Date.now()}`,
      propertyId,
      status: 'active',
      startDate: now.toISOString(),
      nextBillingDate: nextBilling.toISOString(),
      monthlyPrice: 299,
      visits: generateMockVisits(propertyId),
      snapshotInspections: [],
      hasCompletedSnapshot: false,
      currentScore: generateMockScore(propertyId),
      personalDirector: {
        name: 'James Mitchell',
        phone: '1-800-HUDSON',
        email: 'james.mitchell@hudson.com',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      },
    };
    
    const updated = { ...subscriptions, [propertyId]: newSubscription };
    await saveSubscriptions(updated);
    return newSubscription;
  }, [subscriptions, saveSubscriptions]);

  const updateBlueprint = useCallback(async (propertyId: string, blueprint: MyHomeBlueprint) => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return;
    
    const updated = {
      ...subscriptions,
      [propertyId]: {
        ...subscription,
        blueprint,
      },
    };
    
    await saveSubscriptions(updated);
  }, [subscriptions, saveSubscriptions]);

  const addCustomProject = useCallback(async (propertyId: string, project: CustomProject) => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint) return;
    
    const updatedBlueprint = {
      ...subscription.blueprint,
      customProjects: [...(subscription.blueprint.customProjects || []), project],
      updatedAt: new Date().toISOString(),
    };
    
    await updateBlueprint(propertyId, updatedBlueprint);
  }, [subscriptions, updateBlueprint]);

  const removeCustomProject = useCallback(async (propertyId: string, projectId: string) => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint) return;
    
    const updatedBlueprint = {
      ...subscription.blueprint,
      customProjects: (subscription.blueprint.customProjects || []).filter(p => p.id !== projectId),
      updatedAt: new Date().toISOString(),
    };
    
    await updateBlueprint(propertyId, updatedBlueprint);
  }, [subscriptions, updateBlueprint]);

  const updateCustomProject = useCallback(async (propertyId: string, projectId: string, updates: Partial<CustomProject>) => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint) return;
    
    const updatedBlueprint = {
      ...subscription.blueprint,
      customProjects: (subscription.blueprint.customProjects || []).map(p =>
        p.id === projectId ? { ...p, ...updates } : p
      ),
      updatedAt: new Date().toISOString(),
    };
    
    await updateBlueprint(propertyId, updatedBlueprint);
  }, [subscriptions, updateBlueprint]);

  const addMonthlyVisitRequest = useCallback(async (propertyId: string, request: MonthlyVisitRequest) => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint) return;
    
    const currentRequests = subscription.blueprint.monthlyVisitRequests || [];
    if (currentRequests.length >= 5) {
      throw new Error('Maximum 5 monthly visit requests allowed');
    }
    
    const updatedBlueprint = {
      ...subscription.blueprint,
      monthlyVisitRequests: [...currentRequests, request],
      updatedAt: new Date().toISOString(),
    };
    
    await updateBlueprint(propertyId, updatedBlueprint);
  }, [subscriptions, updateBlueprint]);

  const removeMonthlyVisitRequest = useCallback(async (propertyId: string, requestId: string) => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint) return;
    
    const updatedBlueprint = {
      ...subscription.blueprint,
      monthlyVisitRequests: (subscription.blueprint.monthlyVisitRequests || []).filter(r => r.id !== requestId),
      updatedAt: new Date().toISOString(),
    };
    
    await updateBlueprint(propertyId, updatedBlueprint);
  }, [subscriptions, updateBlueprint]);

  const updateScore = useCallback(async (propertyId: string, score: MyHomeScore) => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return;
    
    const updated = {
      ...subscriptions,
      [propertyId]: {
        ...subscription,
        currentScore: score,
      },
    };
    
    await saveSubscriptions(updated);
  }, [subscriptions, saveSubscriptions]);

  const addVisit = useCallback(async (propertyId: string, visit: HudsonVisit) => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return;
    
    const updated = {
      ...subscriptions,
      [propertyId]: {
        ...subscription,
        visits: [...subscription.visits, visit],
      },
    };
    
    await saveSubscriptions(updated);
  }, [subscriptions, saveSubscriptions]);

  const updateVisit = useCallback(async (propertyId: string, visitId: string, updates: Partial<HudsonVisit>) => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return;
    
    const updatedVisits = subscription.visits.map(v =>
      v.id === visitId ? { ...v, ...updates } : v
    );
    
    const updated = {
      ...subscriptions,
      [propertyId]: {
        ...subscription,
        visits: updatedVisits,
      },
    };
    
    await saveSubscriptions(updated);
  }, [subscriptions, saveSubscriptions]);

  const completeTask = useCallback(async (propertyId: string, visitId: string, taskId: string) => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return;
    
    const updatedVisits = subscription.visits.map(visit => {
      if (visit.id === visitId) {
        return {
          ...visit,
          tasks: visit.tasks.map(task =>
            task.id === taskId ? { ...task, completed: true } : task
          ),
        };
      }
      return visit;
    });
    
    const updated = {
      ...subscriptions,
      [propertyId]: {
        ...subscription,
        visits: updatedVisits,
      },
    };
    
    await saveSubscriptions(updated);
  }, [subscriptions, saveSubscriptions]);

  const getNextVisit = useCallback((propertyId: string): HudsonVisit | null => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return null;
    
    const upcoming = subscription.visits.find(v => v.status === 'scheduled');
    return upcoming || null;
  }, [subscriptions]);

  const getRecentVisits = useCallback((propertyId: string, count: number = 3): HudsonVisit[] => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return [];
    
    return subscription.visits
      .filter(v => v.status === 'completed')
      .sort((a, b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime())
      .slice(0, count);
  }, [subscriptions]);

  const cancelSubscription = useCallback(async (propertyId: string) => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return;
    
    const updated = {
      ...subscriptions,
      [propertyId]: {
        ...subscription,
        status: 'cancelled' as const,
      },
    };
    
    await saveSubscriptions(updated);
  }, [subscriptions, saveSubscriptions]);

  const createSnapshotInspection = useCallback(async (propertyId: string, techId: string, techName: string, scheduledDate: string) => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return null;

    const newSnapshot: SnapshotInspection = {
      id: `snapshot-${Date.now()}`,
      propertyId,
      techId,
      techName,
      scheduledDate,
      status: 'scheduled',
      rooms: [],
      overallNotes: '',
      overallImages: [],
      overallAudioNotes: [],
      consultationNotes: '',
      homeownerPriorities: [],
      estimatedDuration: '3-4 hours',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = {
      ...subscriptions,
      [propertyId]: {
        ...subscription,
        snapshotInspections: [...subscription.snapshotInspections, newSnapshot],
      },
    };

    await saveSubscriptions(updated);
    return newSnapshot;
  }, [subscriptions, saveSubscriptions]);

  const updateSnapshotInspection = useCallback(async (propertyId: string, snapshotId: string, updates: Partial<SnapshotInspection>) => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return;

    const updatedSnapshots = subscription.snapshotInspections.map(s =>
      s.id === snapshotId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );

    const updated = {
      ...subscriptions,
      [propertyId]: {
        ...subscription,
        snapshotInspections: updatedSnapshots,
        hasCompletedSnapshot: updates.status === 'completed' ? true : subscription.hasCompletedSnapshot,
      },
    };

    await saveSubscriptions(updated);
  }, [subscriptions, saveSubscriptions]);

  const addRoomInspection = useCallback(async (propertyId: string, snapshotId: string, room: RoomInspection) => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return;

    const snapshot = subscription.snapshotInspections.find(s => s.id === snapshotId);
    if (!snapshot) return;

    const updatedSnapshot = {
      ...snapshot,
      rooms: [...snapshot.rooms, room],
      updatedAt: new Date().toISOString(),
    };

    await updateSnapshotInspection(propertyId, snapshotId, updatedSnapshot);
  }, [subscriptions, updateSnapshotInspection]);

  const updateRoomInspection = useCallback(async (propertyId: string, snapshotId: string, roomId: string, updates: Partial<RoomInspection>) => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return;

    const snapshot = subscription.snapshotInspections.find(s => s.id === snapshotId);
    if (!snapshot) return;

    const updatedRooms = snapshot.rooms.map(r =>
      r.id === roomId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    );

    await updateSnapshotInspection(propertyId, snapshotId, { rooms: updatedRooms });
  }, [subscriptions, updateSnapshotInspection]);

  const deleteRoomInspection = useCallback(async (propertyId: string, snapshotId: string, roomId: string) => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return;

    const snapshot = subscription.snapshotInspections.find(s => s.id === snapshotId);
    if (!snapshot) return;

    const updatedRooms = snapshot.rooms.filter(r => r.id !== roomId);

    await updateSnapshotInspection(propertyId, snapshotId, { rooms: updatedRooms });
  }, [subscriptions, updateSnapshotInspection]);

  const getSnapshotInspection = useCallback((propertyId: string, snapshotId: string): SnapshotInspection | null => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return null;

    return subscription.snapshotInspections.find(s => s.id === snapshotId) || null;
  }, [subscriptions]);

  const getActiveSnapshotInspection = useCallback((propertyId: string): SnapshotInspection | null => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return null;

    return subscription.snapshotInspections.find(s => s.status === 'scheduled' || s.status === 'in-progress') || null;
  }, [subscriptions]);

  return useMemo(() => ({
    subscriptions,
    isLoading,
    getSubscription,
    createSubscription,
    updateBlueprint,
    updateScore,
    addVisit,
    updateVisit,
    completeTask,
    getNextVisit,
    getRecentVisits,
    cancelSubscription,
    addCustomProject,
    removeCustomProject,
    updateCustomProject,
    addMonthlyVisitRequest,
    removeMonthlyVisitRequest,
    createSnapshotInspection,
    updateSnapshotInspection,
    addRoomInspection,
    updateRoomInspection,
    deleteRoomInspection,
    getSnapshotInspection,
    getActiveSnapshotInspection,
  }), [
    subscriptions,
    isLoading,
    getSubscription,
    createSubscription,
    updateBlueprint,
    updateScore,
    addVisit,
    updateVisit,
    completeTask,
    getNextVisit,
    getRecentVisits,
    cancelSubscription,
    addCustomProject,
    removeCustomProject,
    updateCustomProject,
    addMonthlyVisitRequest,
    removeMonthlyVisitRequest,
    createSnapshotInspection,
    updateSnapshotInspection,
    addRoomInspection,
    updateRoomInspection,
    deleteRoomInspection,
    getSnapshotInspection,
    getActiveSnapshotInspection,
  ]);
});
