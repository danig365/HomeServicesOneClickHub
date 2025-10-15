import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Blueprint, FiveYearPlan, BlueprintHistory, BlueprintNotification } from '@/types/blueprint';

export const [BlueprintProvider, useBlueprint] = createContextHook(() => {
  const [blueprints, setBlueprints] = useState<Record<string, Blueprint>>({});
  const [fiveYearPlans, setFiveYearPlans] = useState<Record<string, FiveYearPlan>>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadBlueprint = useCallback(async (propertyId: string) => {
    try {
      setIsLoading(true);

      // Load blueprint
      const { data: blueprint, error: blueprintError } = await supabase
        .from('blueprints')
        .select('*')
        .eq('property_id', propertyId)
        .single();

      if (blueprintError) throw blueprintError;

      // Load five year plan
      const { data: plan, error: planError } = await supabase
        .from('five_year_plans')
        .select('*')
        .eq('blueprint_id', blueprint.id)
        .single();

      if (planError) throw planError;

      // Load yearly plan items
      const { data: items, error: itemsError } = await supabase
        .from('yearly_plan_items')
        .select('*')
        .eq('plan_id', plan.id)
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      if (itemsError) throw itemsError;

      // Load custom projects
      const { data: projects } = await supabase
        .from('custom_projects')
        .select('*')
        .eq('blueprint_id', blueprint.id);

      // Load monthly visit requests
      const { data: requests } = await supabase
        .from('monthly_visit_requests')
        .select('*')
        .eq('blueprint_id', blueprint.id);

      const fullBlueprint: Blueprint = {
        ...blueprint,
        customProjects: projects || [],
        monthlyVisitRequests: requests || [],
      };

      const fullPlan: FiveYearPlan = {
        ...plan,
        items: items || [],
      };

      setBlueprints(prev => ({ ...prev, [propertyId]: fullBlueprint }));
      setFiveYearPlans(prev => ({ ...prev, [propertyId]: fullPlan }));

      return { blueprint: fullBlueprint, plan: fullPlan };
    } catch (error) {
      console.error('Error loading blueprint:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBlueprint = useCallback(async (propertyId: string, subscriptionId: string, data: Partial<Blueprint>) => {
    try {
      setIsLoading(true);

      // Create blueprint
      const { data: blueprint, error: blueprintError } = await supabase
        .from('blueprints')
        .insert([{
          property_id: propertyId,
          subscription_id: subscriptionId,
          five_year_goals: data.five_year_goals || [],
          priority_areas: data.priority_areas || [],
          budget_range: data.budget_range,
          timeline: data.timeline,
        }])
        .select()
        .single();

      if (blueprintError) throw blueprintError;

      // Create five year plan
      const { data: plan, error: planError } = await supabase
        .from('five_year_plans')
        .insert([{
          property_id: propertyId,
          blueprint_id: blueprint.id,
          summary: '',
          total_estimated_cost: '0',
          key_milestones: [],
          generated_by_ai: false,
        }])
        .select()
        .single();

      if (planError) throw planError;

      const fullBlueprint: Blueprint = {
        ...blueprint,
        customProjects: [],
        monthlyVisitRequests: [],
      };

      const fullPlan: FiveYearPlan = {
        ...plan,
        items: [],
      };

      setBlueprints(prev => ({ ...prev, [propertyId]: fullBlueprint }));
      setFiveYearPlans(prev => ({ ...prev, [propertyId]: fullPlan }));

      return { blueprint: fullBlueprint, plan: fullPlan };
    } catch (error) {
      console.error('Error creating blueprint:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBlueprintHistory = useCallback(async (blueprintId: string) => {
    try {
      const { data, error } = await supabase
        .from('blueprint_history')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading blueprint history:', error);
      throw error;
    }
  }, []);

  const addHistoryEntry = useCallback(async (
    blueprintId: string,
    action: BlueprintHistory['action'],
    description: string,
    userId: string,
    userName: string,
    userRole: 'tech' | 'homeowner' | 'admin',
    relatedItemId?: string,
    relatedItemType?: string,
    changes?: any
  ) => {
    try {
      const { error } = await supabase
        .from('blueprint_history')
        .insert([{
          blueprint_id: blueprintId,
          action,
          description,
          user_id: userId,
          user_name: userName,
          user_role: userRole,
          related_item_id: relatedItemId,
          related_item_type: relatedItemType,
          changes,
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding history entry:', error);
      throw error;
    }
  }, []);

  const loadBlueprintNotifications = useCallback(async (blueprintId: string) => {
    try {
      const { data, error } = await supabase
        .from('blueprint_notifications')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading notifications:', error);
      throw error;
    }
  }, []);

  const addNotification = useCallback(async (notification: Omit<BlueprintNotification, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('blueprint_notifications')
        .insert([notification]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
  }, []);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('blueprint_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, []);

  return useMemo(() => ({
    blueprints,
    fiveYearPlans,
    isLoading,
    loadBlueprint,
    createBlueprint,
    loadBlueprintHistory,
    addHistoryEntry,
    loadBlueprintNotifications,
    addNotification,
    markNotificationAsRead,
  }), [
    blueprints,
    fiveYearPlans,
    isLoading,
    loadBlueprint,
    createBlueprint,
    loadBlueprintHistory,
    addHistoryEntry,
    loadBlueprintNotifications,
    addNotification,
    markNotificationAsRead,
  ]);
});
