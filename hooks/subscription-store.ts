import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Subscription, 
  HudsonVisit, 
  MyHomeBlueprint, 
  MyHomeScore,
  SnapshotInspection, 
  RoomInspection, 
  FiveYearPlan, 
  BlueprintHistoryEntry, 
  BlueprintNotification, 
  YearlyPlanItem 
} from '@/types/subscription';
import { getMonthlyTasks } from '@/constants/maintenance-tasks';
// import { useBlueprint } from './blueprint-store';

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
  // const { loadBlueprint, createBlueprint } = useBlueprint();
  
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

    // Update blueprint's subscription_id
    await supabase
      .from('blueprints')
      .update({ subscription_id: newSubscription.id })
      .eq('property_id', propertyId);
    
    const updated = { ...subscriptions, [propertyId]: newSubscription };
    await saveSubscriptions(updated);
    return newSubscription;
  }, [subscriptions, saveSubscriptions]);

  // Define these helper functions first before updateBlueprint
  const addHistoryEntry = useCallback((blueprint: MyHomeBlueprint, entry: Omit<BlueprintHistoryEntry, 'id' | 'timestamp'>) => {
    if (!blueprint) return blueprint;
    return {
      ...blueprint,
      history: [...(blueprint.history || []), {
        ...entry,
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString()
      }]
    };
  }, []);

  const addNotification = useCallback((blueprint: MyHomeBlueprint, notification: Omit<BlueprintNotification, 'id' | 'created_at' | 'read'>) => {
    if (!blueprint) return blueprint;
    return {
      ...blueprint,
      notifications: [...(blueprint.notifications || []), {
        ...notification,
        id: `notif-${Date.now()}`,
        created_at: new Date().toISOString(),
        read: false
      }]
    };
  }, []);

  const updateBlueprint = useCallback(async (
    propertyId: string, 
    updates: Partial<MyHomeBlueprint>,
    historyEntry?: Omit<BlueprintHistoryEntry, 'id' | 'timestamp'>,
    notification?: Omit<BlueprintNotification, 'id' | 'created_at' | 'read'>
  ) => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint) return;

    let updatedBlueprint = {
      ...subscription.blueprint,
      ...updates,
    };

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
        blueprint: updatedBlueprint
      }
    };

    await saveSubscriptions(updated);
  }, [subscriptions, saveSubscriptions, addHistoryEntry, addNotification]);

  const updateScore = useCallback(async (propertyId: string, score: MyHomeScore) => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return;
    
    const updated = {
      ...subscriptions,
      [propertyId]: {
        ...subscription,
        currentScore: score
      }
    };
    
    await saveSubscriptions(updated);
  }, [subscriptions, saveSubscriptions]);

  const addVisit = useCallback(async (propertyId: string, visit: Omit<HudsonVisit, 'id'>) => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return;
    
    const newVisit: HudsonVisit = {
      ...visit,
      id: `visit-${Date.now()}`
    };
    
    const updated = {
      ...subscriptions,
      [propertyId]: {
        ...subscription,
        visits: [...subscription.visits, newVisit]
      }
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

    const updatedVisits = subscription.visits.map(v => {
      if (v.id === visitId) {
        const updatedTasks = v.tasks.map(t =>
          t.id === taskId ? { ...t, completed: true } : t
        );
        return { ...v, tasks: updatedTasks };
      }
      return v;
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
    return subscription.visits.find(v => v.status === 'scheduled') || null;
  }, [subscriptions]);

  const getRecentVisits = useCallback((propertyId: string, limit: number = 3): HudsonVisit[] => {
    const subscription = subscriptions[propertyId];
    if (!subscription) return [];
    return subscription.visits
      .filter(v => v.status === 'completed')
      .sort((a, b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime())
      .slice(0, limit);
  }, [subscriptions]);

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
      blueprint_id: subscription.blueprint.id,
      property_id: propertyId,
      type: 'plan_modified' as const,  // Add type assertion here
      message: `${userName} modified the 5-year maintenance plan`,
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      recipient_role: (userRole === 'tech' ? 'homeowner' : 'tech') as 'tech' | 'homeowner' | 'admin'
    } : undefined;
    
    await updateBlueprint(propertyId, updatedBlueprint, historyEntry, notification);
    console.log('[SubscriptionStore] Five-year plan saved successfully');
  }, [subscriptions, updateBlueprint]);

  const addPlanItem = useCallback(async (
    propertyId: string,
    item: YearlyPlanItem,
    userId: string,
    userName: string,
    userRole: 'tech' | 'homeowner' | 'admin'
  ) => {
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
    
    const notification: Omit<BlueprintNotification, 'id' | 'created_at' | 'read'> = {
      blueprint_id: subscription.blueprint.id,
      property_id: propertyId,
      type: 'plan_modified',
      message: `${userName} added a new item to the 5-year plan: ${item.title}`,
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      recipient_role: (userRole === 'tech' ? 'homeowner' : 'tech') as 'tech' | 'homeowner' | 'admin'
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
    
    const notification: Omit<BlueprintNotification, 'id' | 'created_at' | 'read'> = {
      blueprint_id: subscription.blueprint.id,
      property_id: propertyId,
      type: 'plan_modified',
      message: description,
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      recipient_role: (userRole === 'tech' ? 'homeowner' : 'tech') as 'tech' | 'homeowner' | 'admin'
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
    
    const notification: Omit<BlueprintNotification, 'id' | 'created_at' | 'read'> = {
      blueprint_id: subscription.blueprint.id,
      property_id: propertyId,
      type: 'plan_modified',
      message: `${userName} removed an item from the 5-year plan: ${item.title}`,
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      recipient_role: (userRole === 'tech' ? 'homeowner' : 'tech') as 'tech' | 'homeowner' | 'admin'
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

  // Update getUnreadNotifications to use correct property name
  const getUnreadNotifications = useCallback((propertyId: string, role: 'tech' | 'homeowner' | 'admin') => {
    const subscription = subscriptions[propertyId];
    if (!subscription?.blueprint) return [];
    
    return (subscription.blueprint.notifications || [])
      .filter(n => !n.read && n.recipient_role === role);
  }, [subscriptions]);

  const loadSubscription = useCallback(async (propertyId: string) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let subscriptionData = null;

      if (stored) {
        const parsed = JSON.parse(stored);
        subscriptionData = parsed[propertyId] || null;
      }

      if (!subscriptionData) {
        // Create new subscription if none exists
        subscriptionData = {
          id: `sub-${Date.now()}`,
          propertyId,
          status: 'active',
          startDate: new Date().toISOString(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
      }

      // Update subscriptions state
      setSubscriptions(prev => ({
        ...prev,
        [propertyId]: subscriptionData,
      }));

      return subscriptionData;
    } catch (error) {
      console.error('Error loading subscription:', error);
      throw error;
    }
  }, []);

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
    loadSubscription,
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
    loadSubscription,
  ]);
});
