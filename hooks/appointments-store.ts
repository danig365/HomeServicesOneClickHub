import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Appointment,
  AppointmentDB,
  MaintenanceTaskDB,
  toAppointment
} from '@/types/appointment';

export const [AppointmentsProvider, useAppointments] = createContextHook(() => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize user
  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        // If no user, stop loading
        setIsLoading(false);
      }
    };
    initUser();
  }, []);

  // Load appointments when user is available
  useEffect(() => {
    if (userId) {
      loadAppointments();
    }
  }, [userId]);
  const canAccessAppointment = useCallback(async (appointmentId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const userRole = profile?.role;

      // Admins can access all
      if (userRole === 'admin') return true;

      // Get appointment property
      const { data: visit } = await supabase
        .from('hudson_visits')
        .select('property_id')
        .eq('id', appointmentId)
        .single();

      if (!visit) return false;

      if (userRole === 'tech') {
        // Check if tech is assigned to property
        const { data: assignment } = await supabase
          .from('tech_assignments')
          .select('id')
          .eq('tech_id', userId)
          .eq('property_id', visit.property_id)
          .eq('status', 'active')
          .single();

        return !!assignment;
      }

      if (userRole === 'homeowner') {
        // Check if property belongs to homeowner
        const { data: property } = await supabase
          .from('properties')
          .select('id')
          .eq('id', visit.property_id)
          .eq('user_id', userId)
          .single();

        return !!property;
      }

      return false;
    } catch (error) {
      console.error('Error checking appointment access:', error);
      return false;
    }
  }, [userId]);
  // Load all appointments for the homeowner's properties
  const loadAppointments = useCallback(async () => {
    if (!userId) {
      console.log('No user ID available for loading appointments');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Loading appointments for user:', userId);

      // Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const userRole = profile?.role;

      // Get properties based on role
      let propertyIds: string[] = [];

      if (userRole === 'tech') {
        // For techs, get assigned properties
        const { data: assignments, error: assignError } = await supabase
          .from('tech_assignments')
          .select('property_id')
          .eq('tech_id', userId)
          .eq('status', 'active');

        if (assignError) {
          console.error('Error fetching tech assignments:', assignError);
          throw assignError;
        }

        propertyIds = assignments?.map(a => a.property_id) || [];

        if (propertyIds.length === 0) {
          console.log('No properties assigned to tech');
          setAppointments([]);
          setIsLoading(false);
          return;
        }
      } else if (userRole === 'homeowner') {
        // For homeowners, get their own properties
        const { data: properties, error: propError } = await supabase
          .from('properties')
          .select('id')
          .eq('user_id', userId);

        if (propError) {
          console.error('Error fetching properties:', propError);
          throw propError;
        }

        propertyIds = properties?.map(p => p.id) || [];

        if (propertyIds.length === 0) {
          console.log('No properties found for homeowner');
          setAppointments([]);
          setIsLoading(false);
          return;
        }
      } else if (userRole === 'admin') {
        // Admins can see all appointments - get all property IDs
        const { data: properties, error: propError } = await supabase
          .from('properties')
          .select('id');

        if (propError) {
          console.error('Error fetching properties:', propError);
          throw propError;
        }

        propertyIds = properties?.map(p => p.id) || [];
      }

      console.log('Found property IDs:', propertyIds.length, 'for role:', userRole);

      // Get all hudson visits (appointments) for these properties
      const { data: visitsData, error: visitsError } = await supabase
        .from('hudson_visits')
        .select('*')
        .in('property_id', propertyIds)
        .order('scheduled_date', { ascending: true });

      if (visitsError) {
        console.error('Error fetching visits:', visitsError);
        throw visitsError;
      }

      console.log('Found visits:', visitsData?.length || 0);

      if (!visitsData || visitsData.length === 0) {
        console.log('No visits found for properties');
        setAppointments([]);
        setIsLoading(false);
        return;
      }

      // Get property details for these visits
      const { data: properties, error: propDetailsError } = await supabase
        .from('properties')
        .select('id, name, address, city, state')
        .in('id', propertyIds);

      if (propDetailsError) {
        console.error('Error fetching property details:', propDetailsError);
      }

      // Get all maintenance tasks for these visits
      const visitIds = visitsData.map(v => v.id);
      const { data: tasksData } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .in('visit_id', visitIds);

      console.log('Found tasks:', tasksData?.length || 0);

      // Combine data
      const appointmentsWithDetails: Appointment[] = visitsData.map(visit => {
        const property = properties?.find(p => p.id === visit.property_id);
        const visitTasks = tasksData?.filter(t => t.visit_id === visit.id) || [];

        return toAppointment(
          visit as AppointmentDB,
          visitTasks as MaintenanceTaskDB[],
          property?.name,
          property ? `${property.address}, ${property.city}, ${property.state}` : undefined
        );
      });

      console.log('Processed appointments:', appointmentsWithDetails.length);
      setAppointments(appointmentsWithDetails);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Get single appointment by ID with full details
  const getAppointmentById = useCallback(async (appointmentId: string): Promise<Appointment | null> => {
    try {
      // Get the appointment
      const { data: visitData, error: visitError } = await supabase
        .from('hudson_visits')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (visitError) throw visitError;
      if (!visitData) return null;

      // Get property details
      const { data: property } = await supabase
        .from('properties')
        .select('name, address, city, state')
        .eq('id', visitData.property_id)
        .single();

      // Get tasks
      const { data: tasks } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('visit_id', appointmentId);

      return toAppointment(
        visitData as AppointmentDB,
        tasks as MaintenanceTaskDB[] || [],
        property?.name,
        property ? `${property.address}, ${property.city}, ${property.state}` : undefined
      );
    } catch (error) {
      console.error('Failed to get appointment:', error);
      return null;
    }
  }, []);

  // Complete a maintenance task
  const completeTask = useCallback(async (taskId: string) => {
    if (!userId) throw new Error('Not authenticated');

    try {
      const { error } = await supabase
        .from('maintenance_tasks')
        .update({ completed: true })
        .eq('id', taskId);

      if (error) throw error;

      await loadAppointments();
    } catch (error) {
      console.error('Failed to complete task:', error);
      throw error;
    }
  }, [userId, loadAppointments]);

  // Update appointment notes
  const updateAppointmentNotes = useCallback(async (appointmentId: string, notes: string) => {
    if (!userId) throw new Error('Not authenticated');

    try {
      const { error } = await supabase
        .from('hudson_visits')
        .update({ notes })
        .eq('id', appointmentId);

      if (error) throw error;

      await loadAppointments();
    } catch (error) {
      console.error('Failed to update notes:', error);
      throw error;
    }
  }, [userId, loadAppointments]);

  // Get upcoming appointments - FIX: Added more detailed logging
  const getUpcomingAppointments = useCallback(() => {
    const now = new Date();
    console.log('getUpcomingAppointments called');
    console.log('Current time:', now.toISOString());
    console.log('Total appointments:', appointments.length);

    const upcoming = appointments
      .filter(apt => {
        const aptDate = new Date(apt.scheduledDate);
        const isScheduled = apt.status === 'scheduled';
        const isFuture = aptDate >= now;

        console.log(`Appointment ${apt.id}:`, {
          scheduledDate: apt.scheduledDate,
          status: apt.status,
          isScheduled,
          isFuture,
          passes: isScheduled && isFuture
        });

        return isScheduled && isFuture;
      })
      .sort((a, b) =>
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      );

    console.log('Filtered upcoming appointments:', upcoming.length);
    return upcoming;
  }, [appointments]);

  // Get past appointments
  const getPastAppointments = useCallback(() => {
    const now = new Date();
    return appointments
      .filter(apt =>
        apt.status === 'completed' ||
        apt.status === 'cancelled' ||
        (apt.status === 'scheduled' && new Date(apt.scheduledDate) < now)
      )
      .sort((a, b) =>
        new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
      );
  }, [appointments]);

  // Get appointments by property
  const getAppointmentsByProperty = useCallback((propertyId: string) => {
    return appointments
      .filter(apt => apt.propertyId === propertyId)
      .sort((a, b) =>
        new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
      );
  }, [appointments]);

  return useMemo(() => ({
    appointments,
    isLoading,
    loadAppointments,
    getAppointmentById,
    completeTask,
    updateAppointmentNotes,
    getUpcomingAppointments,
    getPastAppointments,
    getAppointmentsByProperty,
    canAccessAppointment, // Add this if you created it
  }), [
    appointments,
    isLoading,
    loadAppointments,
    getAppointmentById,
    completeTask,
    updateAppointmentNotes,
    getUpcomingAppointments,
    getPastAppointments,
    getAppointmentsByProperty,
    canAccessAppointment, // Add this if you created it
  ]);
});