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

      // First, get all properties for this user
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, name, address, city, state')
        .eq('user_id', userId);

      if (propError) {
        console.error('Error fetching properties:', propError);
        throw propError;
      }

      console.log('Found properties:', properties?.length || 0);
      
      if (!properties || properties.length === 0) {
        console.log('No properties found for user');
        setAppointments([]);
        setIsLoading(false); // FIX: Set loading to false
        return;
      }

      const propertyIds = properties.map(p => p.id);

      // Get all hudson visits (appointments) for these properties
      const { data: visitsData, error: visitsError } = await supabase
        .from('hudson_visits')
        .select('*')
        .in('property_id', propertyIds)
        .order('scheduled_date', { ascending: true }); // FIX: Changed to ascending for upcoming first

      if (visitsError) {
        console.error('Error fetching visits:', visitsError);
        throw visitsError;
      }

      console.log('Found visits:', visitsData?.length || 0);
      console.log('Visits data:', JSON.stringify(visitsData, null, 2)); // ADDED: Debug log

      if (!visitsData || visitsData.length === 0) {
        console.log('No visits found for properties');
        setAppointments([]);
        setIsLoading(false);
        return;
      }

      // Get all maintenance tasks for these visits
      const visitIds = visitsData.map(v => v.id);
      const { data: tasksData } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .in('visit_id', visitIds);

      console.log('Found tasks:', tasksData?.length || 0); // ADDED: Debug log

      // Combine data
      const appointmentsWithDetails: Appointment[] = visitsData.map(visit => {
        const property = properties.find(p => p.id === visit.property_id);
        const visitTasks = tasksData?.filter(t => t.visit_id === visit.id) || [];
        
        return toAppointment(
          visit as AppointmentDB,
          visitTasks as MaintenanceTaskDB[],
          property?.name,
          property ? `${property.address}, ${property.city}, ${property.state}` : undefined
        );
      });

      console.log('Processed appointments:', appointmentsWithDetails.length); // ADDED: Debug log
      console.log('Appointments details:', JSON.stringify(appointmentsWithDetails, null, 2)); // ADDED: Debug log
      
      setAppointments(appointmentsWithDetails);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setAppointments([]); // ADDED: Clear appointments on error
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
  ]);
});