import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth-store';

interface TechAssignment {
  id: string;
  tech_id: string;
  property_id: string;
  status: 'active' | 'inactive';
  assigned_date: string;
}

export const [TechAssignmentsProvider, useTechAssignments] = createContextHook(() => {
  const [assignments, setAssignments] = useState<TechAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load all assignments from Supabase
  const loadAssignments = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      let query = supabase
        .from('tech_assignments')
        .select('*, properties(*)')
        .eq('status', 'active');

      // Only filter by tech_id if not admin
      if (user.role !== 'admin') {
        query = query.eq('tech_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to load assignments:', error);
        return;
      }

      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role]);

  return useMemo(() => ({
    assignments,
    isLoading,
    loadAssignments,
    // Add other functions as needed
  }), [
    assignments,
    isLoading,
    loadAssignments,
  ]);
});