import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface TechAssignment {
    id: string;
    tech_id: string;
    property_id: string;
    assigned_date: string;
    status: 'active' | 'inactive';
    created_at?: string;
}

export interface TechWithProperties {
    tech_id: string;
    tech_name: string;
    tech_email: string;
    properties: {
        property_id: string;
        property_name: string;
        assignment_id: string;
        status: 'active' | 'inactive';
    }[];
}

export const [TechAssignmentsProvider, useTechAssignments] = createContextHook(() => {
    const [assignments, setAssignments] = useState<TechAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load all assignments from Supabase
    const loadAssignments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('tech_assignments')
                .select('*')
                .order('assigned_date', { ascending: false });

            if (fetchError) throw fetchError;
            setAssignments(data || []);
        } catch (err) {
            console.error('Failed to load tech assignments:', err);
            setError('Failed to load tech assignments');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAssignments();
    }, [loadAssignments]);

    // Assign tech to property
    const assignTech = useCallback(async (techId: string, propertyId: string): Promise<boolean> => {
        setError(null);
        try {
            // Check if assignment already exists
            const { data: existing } = await supabase
                .from('tech_assignments')
                .select('*')
                .eq('tech_id', techId)
                .eq('property_id', propertyId)
                .single();

            if (existing) {
                // Reactivate if exists
                const { error: updateError } = await supabase
                    .from('tech_assignments')
                    .update({ status: 'active' })
                    .eq('id', existing.id);

                if (updateError) throw updateError;
            } else {
                // Create new assignment
                const { error: insertError } = await supabase
                    .from('tech_assignments')
                    .insert([{
                        tech_id: techId,
                        property_id: propertyId,
                        assigned_date: new Date().toISOString(),
                        status: 'active',
                    }]);

                if (insertError) throw insertError;
            }

            await loadAssignments();
            return true;
        } catch (err) {
            console.error('Failed to assign tech:', err);
            setError('Failed to assign tech');
            return false;
        }
    }, [loadAssignments]);

    // Unassign tech from property
    const unassignTech = useCallback(async (techId: string, propertyId: string): Promise<boolean> => {
        setError(null);
        try {
            const { error: updateError } = await supabase
                .from('tech_assignments')
                .update({ status: 'inactive' })
                .eq('tech_id', techId)
                .eq('property_id', propertyId);

            if (updateError) throw updateError;

            await loadAssignments();
            return true;
        } catch (err) {
            console.error('Failed to unassign tech:', err);
            setError('Failed to unassign tech');
            return false;
        }
    }, [loadAssignments]);

    // Get all techs assigned to a property
    const getTechsForProperty = useCallback(async (propertyId: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('tech_assignments')
                .select(`
          *,
          profiles:tech_id (
            id,
            full_name,
            email
          )
        `)
                .eq('property_id', propertyId)
                .eq('status', 'active');

            if (fetchError) throw fetchError;
            return data || [];
        } catch (err) {
            console.error('Failed to get techs for property:', err);
            return [];
        }
    }, []);

    // Get all properties assigned to a tech
    const getPropertiesForTech = useCallback(async (techId: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('tech_assignments')
                .select(`
          *,
          properties:property_id (
            id,
            name,
            address
          )
        `)
                .eq('tech_id', techId)
                .eq('status', 'active');

            if (fetchError) throw fetchError;
            return data || [];
        } catch (err) {
            console.error('Failed to get properties for tech:', err);
            return [];
        }
    }, []);

    // Get all active assignments
    const getActiveAssignments = useCallback((): TechAssignment[] => {
        return assignments.filter(a => a.status === 'active');
    }, [assignments]);

    // Get assignment by ID
    const getAssignment = useCallback((assignmentId: string): TechAssignment | null => {
        return assignments.find(a => a.id === assignmentId) || null;
    }, [assignments]);

    // Delete assignment permanently
    const deleteAssignment = useCallback(async (assignmentId: string): Promise<boolean> => {
        setError(null);
        try {
            const { error: deleteError } = await supabase
                .from('tech_assignments')
                .delete()
                .eq('id', assignmentId);

            if (deleteError) throw deleteError;

            await loadAssignments();
            return true;
        } catch (err) {
            console.error('Failed to delete assignment:', err);
            setError('Failed to delete assignment');
            return false;
        }
    }, [loadAssignments]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return useMemo(() => ({
        assignments,
        isLoading,
        error,
        assignTech,
        unassignTech,
        getTechsForProperty,
        getPropertiesForTech,
        getActiveAssignments,
        getAssignment,
        deleteAssignment,
        loadAssignments,
        clearError,
    }), [
        assignments,
        isLoading,
        error,
        assignTech,
        unassignTech,
        getTechsForProperty,
        getPropertiesForTech,
        getActiveAssignments,
        getAssignment,
        deleteAssignment,
        loadAssignments,
        clearError,
    ]);
});