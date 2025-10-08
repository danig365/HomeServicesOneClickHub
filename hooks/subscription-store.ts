import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Subscription, HudsonVisit, MyHomeBlueprint, MyHomeScore, CustomProject, MonthlyVisitRequest, SnapshotInspection, RoomInspection, FiveYearPlan, BlueprintHistoryEntry, BlueprintNotification, YearlyPlanItem } from '@/types/subscription';
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

  const addHistoryEntry = useCallback((blueprint: MyHomeBlueprint, entry: Omit<BlueprintHistoryEntry, 'id' | 'timestamp'>): MyHomeBlueprint => {
    const historyEntry: BlueprintHistoryEntry = {
      ...entry,
      id: `history-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    
    return {
      ...blueprint,
      history: [...(blueprint.history || []), historyEntry],
    };
  }, []);

  const addNotification = useCallback((blueprint: MyHomeBlueprint, notification: Omit<BlueprintNotification, 'id' | 'timestamp' | 'read'>): MyHomeBlueprint => {
    const newNotification: BlueprintNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    return {
      ...blueprint,
      notifications: [...(blueprint.notifications || []), newNotification],
    };
  }, []);

  const updateBlueprint = useCallback(async (propertyId: string, blueprint: MyHomeBlueprint, historyEntry?: Omit<BlueprintHistoryEntry, 'id' | 'timestamp'>, notification?: Omit<BlueprintNotification, 'id' | 'timestamp' | 'read'>) => {
    console.log('[SubscriptionStore] Updating blueprint for property:', propertyId);
    console.log('[SubscriptionStore] Current subscriptions:', Object.keys(subscriptions));
    
    const subscription = subscriptions[propertyId];
    if (!subscription) {
      console.error('[SubscriptionStore] No subscription found for property:', propertyId);
      return;
    }
    
    console.log('[SubscriptionStore] Found subscription, updating blueprint');
    
    let updatedBlueprint = blueprint;
    
    if (historyEntry) {
      updatedBlueprint = addHistoryEntry(updatedBlueprint, historyEntry);
    }
    
    if (notification) {
      updatedBlueprint = addNotification(updatedBlueprint, notification);
    }
    
    const updated = {
      ...subscriptions,
      [propertyId]: {
        ...subscription,
        blueprint: updatedBlueprint,
      },
    };
    
    console.log('[SubscriptionStore] Saving updated subscriptions');
    await saveSubscriptions(updated);
    console.log('[SubscriptionStore] Blueprint saved successfully');
  }, [subscriptions, saveSubscriptions, addHistoryEntry, addNotification]);

  const addCustomProject = useCallback(async (propertyId: string, project: CustomProject, userId: string, userName: string, userRole: 'tech' | 'homeowner' | 'admin') => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint) return;
    
    const updatedBlueprint = {
      ...subscription.blueprint,
      customProjects: [...(subscription.blueprint.customProjects || []), project],
      updatedAt: new Date().toISOString(),
    };
    
    const historyEntry: Omit<BlueprintHistoryEntry, 'id' | 'timestamp'> = {
      action: 'project_added',
      description: `${userName} added project: ${project.title}`,
      userId,
      userName,
      userRole,
      relatedItemId: project.id,
      relatedItemType: 'project',
    };
    
    const notification: Omit<BlueprintNotification, 'id' | 'timestamp' | 'read'> = {
      blueprintId: subscription.blueprint.id,
      propertyId,
      type: 'project_added',
      message: `${userName} added a new project: ${project.title}`,
      userId,
      userName,
      userRole,
      recipientRole: userRole === 'tech' ? 'homeowner' : 'tech',
    };
    
    await updateBlueprint(propertyId, updatedBlueprint, historyEntry, notification);
  }, [subscriptions, updateBlueprint]);

  const removeCustomProject = useCallback(async (propertyId: string, projectId: string, userId: string, userName: string, userRole: 'tech' | 'homeowner' | 'admin') => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint) return;
    
    const project = subscription.blueprint.customProjects?.find(p => p.id === projectId);
    
    const updatedBlueprint = {
      ...subscription.blueprint,
      customProjects: (subscription.blueprint.customProjects || []).filter(p => p.id !== projectId),
      updatedAt: new Date().toISOString(),
    };
    
    const historyEntry: Omit<BlueprintHistoryEntry, 'id' | 'timestamp'> = {
      action: 'project_updated',
      description: `${userName} removed project: ${project?.title || 'Unknown'}`,
      userId,
      userName,
      userRole,
      relatedItemId: projectId,
      relatedItemType: 'project',
    };
    
    await updateBlueprint(propertyId, updatedBlueprint, historyEntry);
  }, [subscriptions, updateBlueprint]);

  const updateCustomProject = useCallback(async (propertyId: string, projectId: string, updates: Partial<CustomProject>, userId: string, userName: string, userRole: 'tech' | 'homeowner' | 'admin') => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint) return;
    
    const oldProject = subscription.blueprint.customProjects?.find(p => p.id === projectId);
    if (!oldProject) return;
    
    const updatedBlueprint = {
      ...subscription.blueprint,
      customProjects: (subscription.blueprint.customProjects || []).map(p =>
        p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
      updatedAt: new Date().toISOString(),
    };
    
    const action = updates.status === 'completed' ? 'project_completed' : 'project_updated';
    const description = updates.status === 'completed' 
      ? `${userName} completed project: ${oldProject.title}`
      : `${userName} updated project: ${oldProject.title}`;
    
    const historyEntry: Omit<BlueprintHistoryEntry, 'id' | 'timestamp'> = {
      action,
      description,
      userId,
      userName,
      userRole,
      relatedItemId: projectId,
      relatedItemType: 'project',
      changes: Object.keys(updates).map(key => ({
        field: key,
        oldValue: (oldProject as any)[key],
        newValue: (updates as any)[key],
      })),
    };
    
    const notification: Omit<BlueprintNotification, 'id' | 'timestamp' | 'read'> = {
      blueprintId: subscription.blueprint.id,
      propertyId,
      type: updates.status === 'completed' ? 'project_completed' : (userRole === 'tech' ? 'tech_update' : 'user_update'),
      message: description,
      userId,
      userName,
      userRole,
      recipientRole: userRole === 'tech' ? 'homeowner' : 'tech',
    };
    
    await updateBlueprint(propertyId, updatedBlueprint, historyEntry, notification);
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

  const updateFiveYearPlan = useCallback(async (propertyId: string, plan: FiveYearPlan, userId?: string, userName?: string, userRole?: 'tech' | 'homeowner' | 'admin') => {
    console.log('[SubscriptionStore] Updating five-year plan for property:', propertyId);
    
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint) {
      console.error('[SubscriptionStore] No blueprint found for property:', propertyId);
      return;
    }
    
    const updatedBlueprint = {
      ...subscription.blueprint,
      fiveYearPlan: plan,
      updatedAt: new Date().toISOString(),
    };
    
    const historyEntry = userId && userName && userRole ? {
      action: 'plan_item_updated' as const,
      description: `${userName} updated the 5-year plan`,
      userId,
      userName,
      userRole,
    } : undefined;
    
    const notification = userId && userName && userRole ? {
      blueprintId: subscription.blueprint.id,
      propertyId,
      type: 'plan_modified' as const,
      message: `${userName} modified the 5-year maintenance plan`,
      userId,
      userName,
      userRole,
      recipientRole: (userRole === 'tech' ? 'homeowner' : 'tech') as 'tech' | 'homeowner' | 'admin',
    } : undefined;
    
    await updateBlueprint(propertyId, updatedBlueprint, historyEntry, notification);
    console.log('[SubscriptionStore] Five-year plan saved successfully');
  }, [subscriptions, updateBlueprint]);

  const addPlanItem = useCallback(async (propertyId: string, item: Omit<YearlyPlanItem, 'id' | 'createdAt'>, userId: string, userName: string, userRole: 'tech' | 'homeowner' | 'admin') => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint) return;
    
    const newItem: YearlyPlanItem = {
      ...item,
      id: `plan-item-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      createdByRole: userRole,
    };
    
    let updatedPlan: FiveYearPlan;
    
    if (subscription.blueprint.fiveYearPlan) {
      updatedPlan = {
        ...subscription.blueprint.fiveYearPlan,
        items: [...subscription.blueprint.fiveYearPlan.items, newItem],
        updatedAt: new Date().toISOString(),
      };
    } else {
      updatedPlan = {
        id: `plan-${Date.now()}`,
        propertyId,
        blueprintId: subscription.blueprint.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generatedByAI: false,
        items: [newItem],
        summary: '',
        keyMilestones: [],
      };
    }
    
    const updatedBlueprint = {
      ...subscription.blueprint,
      fiveYearPlan: updatedPlan,
      updatedAt: new Date().toISOString(),
    };
    
    const historyEntry: Omit<BlueprintHistoryEntry, 'id' | 'timestamp'> = {
      action: 'plan_item_added',
      description: `${userName} added: ${item.title}`,
      userId,
      userName,
      userRole,
      relatedItemId: newItem.id,
      relatedItemType: 'plan_item',
    };
    
    const notification: Omit<BlueprintNotification, 'id' | 'timestamp' | 'read'> = {
      blueprintId: subscription.blueprint.id,
      propertyId,
      type: 'plan_modified',
      message: `${userName} added a new item to the 5-year plan: ${item.title}`,
      userId,
      userName,
      userRole,
      recipientRole: userRole === 'tech' ? 'homeowner' : 'tech',
    };
    
    await updateBlueprint(propertyId, updatedBlueprint, historyEntry, notification);
  }, [subscriptions, updateBlueprint]);

  const updatePlanItem = useCallback(async (propertyId: string, itemId: string, updates: Partial<YearlyPlanItem>, userId: string, userName: string, userRole: 'tech' | 'homeowner' | 'admin') => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint?.fiveYearPlan) return;
    
    const oldItem = subscription.blueprint.fiveYearPlan.items.find(i => i.id === itemId);
    if (!oldItem) return;
    
    const updatedPlan: FiveYearPlan = {
      ...subscription.blueprint.fiveYearPlan,
      items: subscription.blueprint.fiveYearPlan.items.map(item =>
        item.id === itemId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      ),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedBlueprint = {
      ...subscription.blueprint,
      fiveYearPlan: updatedPlan,
      updatedAt: new Date().toISOString(),
    };
    
    const action = updates.status === 'completed' ? 'plan_item_completed' : 'plan_item_updated';
    const description = updates.status === 'completed'
      ? `${userName} completed: ${oldItem.title}`
      : `${userName} updated: ${oldItem.title}`;
    
    const historyEntry: Omit<BlueprintHistoryEntry, 'id' | 'timestamp'> = {
      action,
      description,
      userId,
      userName,
      userRole,
      relatedItemId: itemId,
      relatedItemType: 'plan_item',
      changes: Object.keys(updates).map(key => ({
        field: key,
        oldValue: (oldItem as any)[key],
        newValue: (updates as any)[key],
      })),
    };
    
    const notification: Omit<BlueprintNotification, 'id' | 'timestamp' | 'read'> = {
      blueprintId: subscription.blueprint.id,
      propertyId,
      type: 'plan_modified',
      message: description,
      userId,
      userName,
      userRole,
      recipientRole: userRole === 'tech' ? 'homeowner' : 'tech',
    };
    
    await updateBlueprint(propertyId, updatedBlueprint, historyEntry, notification);
  }, [subscriptions, updateBlueprint]);

  const removePlanItem = useCallback(async (propertyId: string, itemId: string, userId: string, userName: string, userRole: 'tech' | 'homeowner' | 'admin') => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint?.fiveYearPlan) return;
    
    const item = subscription.blueprint.fiveYearPlan.items.find(i => i.id === itemId);
    if (!item) return;
    
    const updatedPlan: FiveYearPlan = {
      ...subscription.blueprint.fiveYearPlan,
      items: subscription.blueprint.fiveYearPlan.items.filter(i => i.id !== itemId),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedBlueprint = {
      ...subscription.blueprint,
      fiveYearPlan: updatedPlan,
      updatedAt: new Date().toISOString(),
    };
    
    const historyEntry: Omit<BlueprintHistoryEntry, 'id' | 'timestamp'> = {
      action: 'plan_item_removed',
      description: `${userName} removed: ${item.title}`,
      userId,
      userName,
      userRole,
      relatedItemId: itemId,
      relatedItemType: 'plan_item',
    };
    
    const notification: Omit<BlueprintNotification, 'id' | 'timestamp' | 'read'> = {
      blueprintId: subscription.blueprint.id,
      propertyId,
      type: 'plan_modified',
      message: `${userName} removed an item from the 5-year plan: ${item.title}`,
      userId,
      userName,
      userRole,
      recipientRole: userRole === 'tech' ? 'homeowner' : 'tech',
    };
    
    await updateBlueprint(propertyId, updatedBlueprint, historyEntry, notification);
  }, [subscriptions, updateBlueprint]);

  const markNotificationAsRead = useCallback(async (propertyId: string, notificationId: string) => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint) return;
    
    const updatedBlueprint = {
      ...subscription.blueprint,
      notifications: (subscription.blueprint.notifications || []).map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    };
    
    await updateBlueprint(propertyId, updatedBlueprint);
  }, [subscriptions, updateBlueprint]);

  const getUnreadNotifications = useCallback((propertyId: string, role: 'tech' | 'homeowner' | 'admin') => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint) return [];
    
    return (subscription.blueprint.notifications || []).filter(n => !n.read && n.recipientRole === role);
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
    updateFiveYearPlan,
    addPlanItem,
    updatePlanItem,
    removePlanItem,
    markNotificationAsRead,
    getUnreadNotifications,
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
    updateFiveYearPlan,
    addPlanItem,
    updatePlanItem,
    removePlanItem,
    markNotificationAsRead,
    getUnreadNotifications,
  ]);
});
