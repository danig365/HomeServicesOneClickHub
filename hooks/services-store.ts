//New File Added 
import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Service } from '@/types/service';

export const [ServicesProvider, useServices] = createContextHook(() => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all services from Supabase
  const loadServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setServices(data || []);
    } catch (err) {
      console.error('Failed to load services:', err);
      setError('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Get single service by ID
  const getService = useCallback((serviceId: string): Service | null => {
    return services.find(s => s.id === serviceId) || null;
  }, [services]);

  // Create new service
  const createService = useCallback(async (serviceData: Omit<Service, 'id' | 'created_at'>): Promise<Service | null> => {
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('services')
        .insert([serviceData])
        .select()
        .single();

      if (insertError) throw insertError;

      await loadServices();
      return data;
    } catch (err) {
      console.error('Failed to create service:', err);
      setError('Failed to create service');
      return null;
    }
  }, [loadServices]);

  // Update existing service
  const updateService = useCallback(async (serviceId: string, updates: Partial<Service>): Promise<boolean> => {
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId);

      if (updateError) throw updateError;

      await loadServices();
      return true;
    } catch (err) {
      console.error('Failed to update service:', err);
      setError('Failed to update service');
      return false;
    }
  }, [loadServices]);

  // Delete service
  const deleteService = useCallback(async (serviceId: string): Promise<boolean> => {
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (deleteError) throw deleteError;

      await loadServices();
      return true;
    } catch (err) {
      console.error('Failed to delete service:', err);
      setError('Failed to delete service');
      return false;
    }
  }, [loadServices]);

  // Get services by category
  const getServicesByCategory = useCallback((category: string): Service[] => {
    return services.filter(s => s.category === category);
  }, [services]);

  // Get popular services
  const getPopularServices = useCallback((): Service[] => {
    return services.filter(s => s.popular);
  }, [services]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo(() => ({
    services,
    isLoading,
    error,
    getService,
    createService,
    updateService,
    deleteService,
    getServicesByCategory,
    getPopularServices,
    loadServices,
    clearError,
  }), [
    services,
    isLoading,
    error,
    getService,
    createService,
    updateService,
    deleteService,
    getServicesByCategory,
    getPopularServices,
    loadServices,
    clearError,
  ]);
});