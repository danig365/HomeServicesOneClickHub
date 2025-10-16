import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { User, UserRole, TechAssignment } from '@/types/user';
import { supabase } from '@/lib/supabase';

export const [UserProvider, useUser] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [techs, setTechs] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<TechAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load current user from auth
  const loadCurrentUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setCurrentUser(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) throw error;

      // Get assigned properties if user is a tech
      let assignedProperties: string[] = [];
      if (profile.role === 'tech') {
        const { data: techAssignments } = await supabase
          .from('tech_assignments')
          .select('property_id')
          .eq('tech_id', authUser.id)
          .eq('status', 'active');
        
        assignedProperties = techAssignments?.map(ta => ta.property_id) || [];
      }

      setCurrentUser({
        id: profile.id,
        name: profile.full_name || '',
        email: profile.email,
        phone: '', // Add phone to profiles table if needed
        role: profile.role,
        assignedProperties,
      });
    } catch (error) {
      console.error('Failed to load current user:', error);
      setCurrentUser(null);
    }
  }, []);

  // Load all techs
  const loadTechs = useCallback(async () => {
    try {
      const { data: techProfiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tech')
        .order('full_name');

      if (error) throw error;

      // Get all tech assignments
      const { data: allAssignments } = await supabase
        .from('tech_assignments')
        .select('tech_id, property_id, status')
        .eq('status', 'active');

      const techsWithAssignments: User[] = (techProfiles || []).map(profile => {
        const techAssignments = allAssignments?.filter(a => a.tech_id === profile.id) || [];
        
        return {
          id: profile.id,
          name: profile.full_name || '',
          email: profile.email,
          phone: '', // Add phone to profiles if needed
          role: profile.role as UserRole,
          assignedProperties: techAssignments.map(a => a.property_id),
        };
      });

      setTechs(techsWithAssignments);
    } catch (error) {
      console.error('Failed to load techs:', error);
      setTechs([]);
    }
  }, []);

  // Load all assignments
  const loadAssignments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tech_assignments')
        .select('*')
        .order('assigned_date', { ascending: false });

      if (error) throw error;

      const formattedAssignments: TechAssignment[] = (data || []).map(assignment => ({
        techId: assignment.tech_id,
        propertyId: assignment.property_id,
        assignedDate: assignment.assigned_date,
        status: assignment.status as 'active' | 'inactive',
      }));

      setAssignments(formattedAssignments);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      setAssignments([]);
    }
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadCurrentUser(),
        loadTechs(),
        loadAssignments(),
      ]);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadCurrentUser, loadTechs, loadAssignments]);

  useEffect(() => {
    loadData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadCurrentUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadData, loadCurrentUser]);

  // Switch role (for testing - remove in production)
  const switchRole = useCallback(async (role: UserRole) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ role })
        .eq('id', user.id);

      await loadCurrentUser();
    } catch (error) {
      console.error('Failed to switch role:', error);
    }
  }, [loadCurrentUser]);

  // Assign tech to property
  const assignTechToProperty = useCallback(async (techId: string, propertyId: string) => {
    try {
      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('tech_assignments')
        .select('id, status')
        .eq('tech_id', techId)
        .eq('property_id', propertyId)
        .single();

      if (existing) {
        // If exists but inactive, reactivate it
        if (existing.status === 'inactive') {
          const { error } = await supabase
            .from('tech_assignments')
            .update({ 
              status: 'active',
              assigned_date: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (error) throw error;
        }
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('tech_assignments')
          .insert({
            tech_id: techId,
            property_id: propertyId,
            status: 'active',
            assigned_date: new Date().toISOString(),
          });

        if (error) throw error;
      }

      // Reload data
      await Promise.all([loadTechs(), loadAssignments()]);
      
      console.log('Tech assigned successfully');
    } catch (error) {
      console.error('Failed to assign tech:', error);
      throw error;
    }
  }, [loadTechs, loadAssignments]);

  // Unassign tech from property
  const unassignTechFromProperty = useCallback(async (techId: string, propertyId: string) => {
    try {
      const { error } = await supabase
        .from('tech_assignments')
        .update({ status: 'inactive' })
        .eq('tech_id', techId)
        .eq('property_id', propertyId)
        .eq('status', 'active');

      if (error) throw error;

      // Reload data
      await Promise.all([loadTechs(), loadAssignments()]);
      
      console.log('Tech unassigned successfully');
    } catch (error) {
      console.error('Failed to unassign tech:', error);
      throw error;
    }
  }, [loadTechs, loadAssignments]);

  // Get techs for a specific property
  // Replace the getTechsForProperty function in user-store.ts with this:

const getTechsForProperty = useCallback(async (propertyId: string): Promise<User[]> => {
  try {
    // Get tech assignments with profiles in separate queries for better type safety
    const { data: assignments, error: assignError } = await supabase
      .from('tech_assignments')
      .select('tech_id, assigned_date, status')
      .eq('property_id', propertyId)
      .eq('status', 'active');

    if (assignError) throw assignError;
    if (!assignments || assignments.length === 0) return [];

    // Get profiles for all assigned techs
    const techIds = assignments.map(a => a.tech_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('id', techIds)
      .eq('role', 'tech');

    if (profileError) throw profileError;

    return (profiles || []).map(profile => ({
      id: profile.id,
      name: profile.full_name || '',
      email: profile.email,
      phone: '',
      role: profile.role as UserRole,
      assignedProperties: [propertyId], // This tech is assigned to this property
    }));
  } catch (error) {
    console.error('Failed to get techs for property:', error);
    return [];
  }
}, []);

  // Get properties for a specific tech
  const getPropertiesForTech = useCallback(async (techId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('tech_assignments')
        .select('property_id')
        .eq('tech_id', techId)
        .eq('status', 'active');

      if (error) throw error;

      return (data || []).map(assignment => assignment.property_id);
    } catch (error) {
      console.error('Failed to get properties for tech:', error);
      return [];
    }
  }, []);

  // Check if tech is assigned to property
  const isTechAssignedToProperty = useCallback(async (techId: string, propertyId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('tech_assignments')
        .select('id')
        .eq('tech_id', techId)
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error

      return !!data;
    } catch (error) {
      console.error('Failed to check tech assignment:', error);
      return false;
    }
  }, []);

  // Get all assignments for a property (with tech details)
  const getAssignmentsForProperty = useCallback(async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('tech_assignments')
        .select(`
          *,
          profiles!tech_assignments_tech_id_fkey (
            id,
            email,
            full_name,
            role
          )
        `)
        .eq('property_id', propertyId)
        .order('assigned_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(assignment => ({
        id: assignment.id,
        techId: assignment.tech_id,
        propertyId: assignment.property_id,
        assignedDate: assignment.assigned_date,
        status: assignment.status as 'active' | 'inactive',
        tech: {
          id: assignment.profiles.id,
          name: assignment.profiles.full_name || '',
          email: assignment.profiles.email,
          role: assignment.profiles.role as UserRole,
        },
      }));
    } catch (error) {
      console.error('Failed to get assignments for property:', error);
      return [];
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return useMemo(() => ({
    currentUser,
    techs,
    assignments,
    isLoading,
    switchRole,
    assignTechToProperty,
    unassignTechFromProperty,
    getTechsForProperty,
    getPropertiesForTech,
    isTechAssignedToProperty,
    getAssignmentsForProperty,
    refreshData,
  }), [
    currentUser,
    techs,
    assignments,
    isLoading,
    switchRole,
    assignTechToProperty,
    unassignTechFromProperty,
    getTechsForProperty,
    getPropertiesForTech,
    isTechAssignedToProperty,
    getAssignmentsForProperty,
    refreshData,
  ]);
});