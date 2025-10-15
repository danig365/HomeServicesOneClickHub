import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { Booking, RecurringService,BookingDB, RecurringServiceDB  } from '@/types/service';
import { supabase } from '@/lib/supabase';

export const [BookingsProvider, useBookings] = createContextHook(() => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recurringServices, setRecurringServices] = useState<RecurringService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
  const initUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };
  initUser();
}, []);

useEffect(() => {
  if (userId) {
    loadBookings();
    loadRecurringServices();
  }
}, [userId]);
const loadBookings = async () => {
  if (!userId) return;
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    const legacy: Booking[] = (data || []).map(db => ({
      id: db.id,
      serviceId: db.service_id,
      serviceName: db.service_name,
      date: db.scheduled_date,
      time: db.scheduled_time,
      status: db.status as 'upcoming' | 'completed' | 'cancelled',
      price: Number(db.price),
      address: '', // Load from property if needed
      providerName: db.provider_name || undefined,
      propertyId: db.property_id,
    }));

    setBookings(legacy);
  } catch (error) {
    console.error('Failed to load bookings:', error);
  } finally {
    setIsLoading(false);
  }
};
  const loadRecurringServices = async () => {
  if (!userId) return;
  try {
    const { data, error } = await supabase
      .from('recurring_services')
      .select('*')
      .eq('user_id', userId)
      .order('next_service_date', { ascending: true });

    if (error) throw error;

    const legacy: RecurringService[] = (data || []).map(db => ({
      id: db.id,
      serviceId: db.service_id,
      serviceName: db.service_name,
      frequency: db.frequency as 'monthly' | 'quarterly' | 'bi-annual' | 'annual',
      price: Number(db.price),
      startDate: db.start_date,
      nextServiceDate: db.next_service_date,
      status: db.status as 'active' | 'paused' | 'cancelled',
      autoRenew: db.auto_renew,
      propertyId: db.property_id,
    }));

    setRecurringServices(legacy);
  } catch (error) {
    console.error('Failed to load recurring services:', error);
  }
};
  // const saveBookings = async (newBookings: Booking[]) => {
  //   try {
  //     await AsyncStorage.setItem('bookings', JSON.stringify(newBookings));
  //   } catch (error) {
  //     console.error('Failed to save bookings:', error);
  //   }
  // };

  // const saveRecurringServices = async (services: RecurringService[]) => {
  //   try {
  //     await AsyncStorage.setItem('recurringServices', JSON.stringify(services));
  //   } catch (error) {
  //     console.error('Failed to save recurring services:', error);
  //   }
  // };

  const addBooking = async (booking: Omit<Booking, 'id'>) => {
  if (!userId) throw new Error('Not authenticated');

  try {
    const dbBooking: Omit<BookingDB, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      property_id: booking.propertyId || '',
      service_id: booking.serviceId,
      service_name: booking.serviceName,
      scheduled_date: booking.date,
      scheduled_time: booking.time,
      status: booking.status,
      price: booking.price,
      provider_name: booking.providerName || null,
      notes: null,
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([dbBooking])
      .select()
      .single();

    if (error) throw error;

    await loadBookings();
    return data as any;
  } catch (error) {
    console.error('Failed to add booking:', error);
    throw error;
  }
};

const cancelBooking = async (bookingId: string) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('user_id', userId);

    if (error) throw error;
    await loadBookings();
  } catch (error) {
    console.error('Failed to cancel booking:', error);
    throw error;
  }
};

  const getUpcomingBookings = () => {
    return bookings.filter(b => b.status === 'upcoming');
  };

  const getPastBookings = () => {
    return bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  };
const addRecurringService = async (service: Omit<RecurringService, 'id'>) => {
  if (!userId) throw new Error('Not authenticated');

  try {
    const dbService: Omit<RecurringServiceDB, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      property_id: service.propertyId || '',
      service_id: service.serviceId,
      service_name: service.serviceName,
      frequency: service.frequency,
      price: service.price,
      start_date: service.startDate,
      next_service_date: service.nextServiceDate,
      status: service.status,
      auto_renew: service.autoRenew,
    };

    const { data, error } = await supabase
      .from('recurring_services')
      .insert([dbService])
      .select()
      .single();

    if (error) throw error;

    await loadRecurringServices();
    return data as any;
  } catch (error) {
    console.error('Failed to add recurring service:', error);
    throw error;
  }
};

const updateRecurringService = async (serviceId: string, updates: Partial<RecurringService>) => {
  if (!userId) return;

  try {
    const dbUpdates: any = {};
    if (updates.nextServiceDate) dbUpdates.next_service_date = updates.nextServiceDate;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.autoRenew !== undefined) dbUpdates.auto_renew = updates.autoRenew;
    if (updates.price !== undefined) dbUpdates.price = updates.price;

    const { error } = await supabase
      .from('recurring_services')
      .update(dbUpdates)
      .eq('id', serviceId)
      .eq('user_id', userId);

    if (error) throw error;
    await loadRecurringServices();
  } catch (error) {
    console.error('Failed to update recurring service:', error);
    throw error;
  }
};

const pauseRecurringService = async (serviceId: string) => {
  await updateRecurringService(serviceId, { status: 'paused' });
};

const resumeRecurringService = async (serviceId: string) => {
  await updateRecurringService(serviceId, { status: 'active' });
};

const cancelRecurringService = async (serviceId: string) => {
  await updateRecurringService(serviceId, { status: 'cancelled' });
};

  const getActiveRecurringServices = () => {
    return recurringServices.filter(s => s.status === 'active');
  };

  const getPausedRecurringServices = () => {
    return recurringServices.filter(s => s.status === 'paused');
  };

  return {
    bookings,
    recurringServices,
    isLoading,
    addBooking,
    cancelBooking,
    getUpcomingBookings,
    getPastBookings,
    addRecurringService,
    updateRecurringService,
    pauseRecurringService,
    resumeRecurringService,
    cancelRecurringService,
    getActiveRecurringServices,
    getPausedRecurringServices
  };
});