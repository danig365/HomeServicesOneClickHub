import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  PropertyInput,
  PropertyInsightInput,
  PropertyReminderInput,
  LegacyProperty,
  toLegacyProperty,
  toDbPropertyInput
} from '@/types/property';
import { TechAppointment } from '@/types/tech-appointment';

const SELECTED_PROPERTY_KEY = 'selected_property_id';

export const [PropertiesProvider, useProperties] = createContextHook(() => {
  const [properties, setProperties] = useState<LegacyProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize and get current user
  useEffect(() => {
    const initializeUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    initializeUser();
  }, []);

  // Get assigned techs for a property
  const getAssignedTechs = useCallback(async (propertyId: string) => {
    try {
      // First get tech IDs
      const { data: assignments, error: assignError } = await supabase
        .from('tech_assignments')
        .select('tech_id, assigned_date')
        .eq('property_id', propertyId)
        .eq('status', 'active');

      if (assignError) throw assignError;
      if (!assignments || assignments.length === 0) return [];

      // Then get tech profiles
      const techIds = assignments.map(a => a.tech_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .in('id', techIds);

      if (profileError) throw profileError;

      // Combine data
      return (profiles || []).map(profile => {
        const assignment = assignments.find(a => a.tech_id === profile.id);
        return {
          id: profile.id,
          name: profile.full_name || '',
          email: profile.email,
          role: profile.role,
          assignedDate: assignment?.assigned_date || '',
        };
      });
    } catch (error) {
      console.error('Failed to get assigned techs:', error);
      return [];
    }
  }, []);

  // Load properties from Supabase - FIXED QUERY
  const loadProperties = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      console.log('[Properties] Loading properties for user:', userId);

      // Get user's role first
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const userRole = profile?.role;
      let propertiesData;

      if (userRole === 'tech') {
        // For techs: Get properties through tech_assignments
        const { data: techProps, error } = await supabase
          .from('tech_assignments')
          .select(`
            property_id,
            properties!inner (
              *,
              blueprints (*),
              property_insights (*),
              property_reminders (*)
            )
          `)
          .eq('tech_id', userId)
          .eq('status', 'active');

        if (error) throw error;
        
        // Extract properties from the joined data
        propertiesData = techProps?.map(item => item.properties).filter(Boolean) || [];
      } else if (userRole === 'homeowner') {
        // For homeowners: Direct property query
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            blueprints (*),
            property_insights (*),
            property_reminders (*)
          `)
          .eq('user_id', userId)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        propertiesData = data || [];
      } else {
        // For admins: Get all properties
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            blueprints (*),
            property_insights (*),
            property_reminders (*)
          `)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        propertiesData = data || [];
      }

      // Transform to legacy format
      const legacyProperties = propertiesData.map(prop => {
        const propInsights = prop.property_insights || [];
        const propReminders = prop.property_reminders || [];
        return toLegacyProperty(prop, propInsights, propReminders);
      });

      setProperties(legacyProperties);

      // Handle property selection
      const storedSelectedId = await AsyncStorage.getItem(SELECTED_PROPERTY_KEY);
      if (storedSelectedId && legacyProperties.some(p => p.id === storedSelectedId)) {
        setSelectedPropertyId(storedSelectedId);
      } else {
        const primary = legacyProperties.find(p => p.isPrimary);
        const selected = primary?.id || legacyProperties[0]?.id || null;
        setSelectedPropertyId(selected);
        if (selected) {
          await AsyncStorage.setItem(SELECTED_PROPERTY_KEY, selected);
        }
      }

      console.log('[Properties] Loaded', legacyProperties.length, 'properties for role:', userRole);
    } catch (error) {
      console.error('[Properties] Error loading properties:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadProperties();
    }
  }, [userId, loadProperties]);

  // Select property
  const selectProperty = useCallback(async (id: string) => {
    setSelectedPropertyId(id);
    try {
      await AsyncStorage.setItem(SELECTED_PROPERTY_KEY, id);
    } catch (error) {
      console.error('Failed to save selected property:', error);
    }
  }, []);

  // Add property
  const addProperty = useCallback(async (property: Omit<LegacyProperty, 'id' | 'insights' | 'reminders'>) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const dbInput = toDbPropertyInput(property) as PropertyInput;

      // If this is the first property, set it as primary
      const { data: existingProps } = await supabase
        .from('properties')
        .select('id')
        .eq('user_id', userId);

      const shouldBePrimary = !existingProps || existingProps.length === 0;

      // Start a Supabase transaction
      const { data: result, error: transactionError } = await supabase.rpc('create_property_with_blueprint', {
        property_data: {
          ...dbInput,
          user_id: userId,
          is_primary: shouldBePrimary || dbInput.is_primary,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        subscription_data: {
          status: 'active',
          start_date: new Date().toISOString(),
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          monthly_price: 299
        }
      });

      if (transactionError) throw transactionError;

      // Load the newly created property
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', result.property_id)
        .single();

      if (propertyError) throw propertyError;

      const newProperty = toLegacyProperty(propertyData, [], []);

      // Update local state
      setProperties(prev => [...prev, newProperty]);

      // If this is the first property or set as primary, select it
      if (shouldBePrimary || property.isPrimary) {
        await selectProperty(newProperty.id);
      }

      // Trigger a refresh to ensure all related data is loaded
      await loadProperties();

      return newProperty;
    } catch (error) {
      console.error('Failed to add property:', error);
      throw error;
    }
  }, [userId, selectProperty, loadProperties]);

  // Update property
  const updateProperty = useCallback(async (id: string, updates: Partial<LegacyProperty>) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const dbUpdates = toDbPropertyInput(updates);

      // If setting as primary, unset other primary properties first
      if (dbUpdates.is_primary) {
        await supabase
          .from('properties')
          .update({ is_primary: false })
          .eq('user_id', userId)
          .eq('is_primary', true)
          .neq('id', id);
      }

      const { error } = await supabase
        .from('properties')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Reload to get fresh data with insights and reminders
      await loadProperties();
    } catch (error) {
      console.error('Failed to update property:', error);
      throw error;
    }
  }, [userId, loadProperties]);

  // Delete property
  const deleteProperty = useCallback(async (id: string) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      setProperties(prev => {
        const updated = prev.filter(p => p.id !== id);

        // If no primary property, set first as primary
        if (updated.length > 0 && !updated.some(p => p.isPrimary)) {
          updateProperty(updated[0].id, { isPrimary: true });
        }

        return updated;
      });

      // Update selected property if needed
      if (selectedPropertyId === id) {
        const remaining = properties.filter(p => p.id !== id);
        const newSelected = remaining[0]?.id || null;
        setSelectedPropertyId(newSelected);
        if (newSelected) {
          await AsyncStorage.setItem(SELECTED_PROPERTY_KEY, newSelected);
        } else {
          await AsyncStorage.removeItem(SELECTED_PROPERTY_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to delete property:', error);
      throw error;
    }
  }, [userId, selectedPropertyId, properties, updateProperty]);

  // Get selected property
  const getSelectedProperty = useCallback(() => {
    return properties.find(p => p.id === selectedPropertyId) || properties[0] || null;
  }, [properties, selectedPropertyId]);

  // Get primary property
  const getPrimaryProperty = useCallback(() => {
    return properties.find(p => p.isPrimary) || properties[0] || null;
  }, [properties]);

  // Add insight
  const addInsight = useCallback(async (propertyId: string, insight: Omit<PropertyInsightInput, 'property_id'>) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('property_insights')
        .insert([{ ...insight, property_id: propertyId }])
        .select()
        .single();

      if (error) throw error;

      // Reload properties to update insights
      await loadProperties();
    } catch (error) {
      console.error('Failed to add insight:', error);
      throw error;
    }
  }, [userId, loadProperties]);

  // Update insight
  const updateInsight = useCallback(async (propertyId: string, insightId: string, updates: Partial<PropertyInsightInput>) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('property_insights')
        .update(updates)
        .eq('id', insightId)
        .eq('property_id', propertyId);

      if (error) throw error;

      await loadProperties();
    } catch (error) {
      console.error('Failed to update insight:', error);
      throw error;
    }
  }, [userId, loadProperties]);

  // Delete insight
  const deleteInsight = useCallback(async (propertyId: string, insightId: string) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('property_insights')
        .delete()
        .eq('id', insightId)
        .eq('property_id', propertyId);

      if (error) throw error;

      await loadProperties();
    } catch (error) {
      console.error('Failed to delete insight:', error);
      throw error;
    }
  }, [userId, loadProperties]);

  // Add reminder
  const addReminder = useCallback(async (propertyId: string, reminder: PropertyReminderInput) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('property_reminders')
        .insert([{ ...reminder, property_id: propertyId }])
        .select()
        .single();

      if (error) throw error;

      await loadProperties();
    } catch (error) {
      console.error('Failed to add reminder:', error);
      throw error;
    }
  }, [userId, loadProperties]);

  // Update reminder
  const updateReminder = useCallback(async (propertyId: string, reminderId: string, updates: Partial<PropertyReminderInput>) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('property_reminders')
        .update(updates)
        .eq('id', reminderId)
        .eq('property_id', propertyId);

      if (error) throw error;

      await loadProperties();
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw error;
    }
  }, [userId, loadProperties]);

  // Delete reminder
  const deleteReminder = useCallback(async (propertyId: string, reminderId: string) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('property_reminders')
        .delete()
        .eq('id', reminderId)
        .eq('property_id', propertyId);

      if (error) throw error;

      await loadProperties();
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      throw error;
    }
  }, [userId, loadProperties]);

  // Complete reminder
  const completeReminder = useCallback(async (propertyId: string, reminderId: string) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const property = properties.find(p => p.id === propertyId);
      if (!property || !property.reminders) return;

      const reminder = property.reminders.find(r => r.id === reminderId);
      if (!reminder) return;

      const updates: Partial<PropertyReminderInput & { completed: boolean; completed_date: string }> = {
        completed: true,
        completed_date: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('property_reminders')
        .update(updates)
        .eq('id', reminderId)
        .eq('property_id', propertyId);

      if (error) throw error;

      // If recurring, create a new reminder
      if (reminder.recurring && reminder.recurringInterval) {
        const nextDueDate = new Date(reminder.dueDate);
        nextDueDate.setDate(nextDueDate.getDate() + reminder.recurringInterval);

        await addReminder(propertyId, {
          title: reminder.title,
          description: reminder.description,
          due_date: nextDueDate.toISOString(),
          type: reminder.type,
          priority: reminder.priority,
          recurring: reminder.recurring,
          recurring_interval: reminder.recurringInterval,
          created_by: reminder.createdBy,
          created_by_role: reminder.createdByRole,
        });
      }

      await loadProperties();
    } catch (error) {
      console.error('Failed to complete reminder:', error);
      throw error;
    }
  }, [userId, properties, loadProperties, addReminder]);

  // Get upcoming reminders
  const getUpcomingReminders = useCallback((propertyId: string, days: number = 30) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property || !property.reminders) return [];

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return property.reminders
      .filter(r => !r.completed && new Date(r.dueDate) <= futureDate && new Date(r.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [properties]);

  // Get overdue reminders
  const getOverdueReminders = useCallback((propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property || !property.reminders) return [];

    const now = new Date();
    return property.reminders
      .filter(r => !r.completed && new Date(r.dueDate) < now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [properties]);

  return useMemo(() => ({
    properties,
    selectedPropertyId,
    isLoading,
    addProperty,
    updateProperty,
    deleteProperty,
    selectProperty,
    getSelectedProperty,
    getPrimaryProperty,
    addInsight,
    updateInsight,
    deleteInsight,
    addReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    getUpcomingReminders,
    getOverdueReminders,
    refreshProperties: loadProperties,
    getAssignedTechs,
  }), [
    properties,
    selectedPropertyId,
    isLoading,
    addProperty,
    updateProperty,
    deleteProperty,
    selectProperty,
    getSelectedProperty,
    getPrimaryProperty,
    addInsight,
    updateInsight,
    deleteInsight,
    addReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    getUpcomingReminders,
    getOverdueReminders,
    loadProperties,
    getAssignedTechs,
  ]);
});

export const [TechAppointmentsProvider, useTechAppointments] = createContextHook(() => {
  const [appointments, setAppointments] = useState<TechAppointment[]>([]);

  const getUpcomingAppointments = useCallback((techId?: string) => {
    return appointments.filter(apt => 
      apt.status === 'upcoming' && (!techId || apt.techId === techId)
    );
  }, [appointments]);

  const getInProgressAppointments = useCallback((techId?: string) => {
    return appointments.filter(apt => 
      apt.status === 'in-progress' && (!techId || apt.techId === techId)
    );
  }, [appointments]);

  // Add this function
  const getAppointmentsByProperty = useCallback((propertyId: string) => {
    return appointments.filter(apt => apt.propertyId === propertyId);
  }, [appointments]);

  return {
    appointments,
    getUpcomingAppointments,
    getInProgressAppointments,
    getAppointmentsByProperty, // Add to return object
  };
});