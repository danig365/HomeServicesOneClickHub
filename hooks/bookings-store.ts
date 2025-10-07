import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Booking, RecurringService } from '@/types/service';

export const [BookingsProvider, useBookings] = createContextHook(() => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recurringServices, setRecurringServices] = useState<RecurringService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookings();
    loadRecurringServices();
  }, []);

  const loadBookings = async () => {
    try {
      const stored = await AsyncStorage.getItem('bookings');
      if (stored) {
        setBookings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecurringServices = async () => {
    try {
      const stored = await AsyncStorage.getItem('recurringServices');
      if (stored) {
        setRecurringServices(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recurring services:', error);
    }
  };

  const saveBookings = async (newBookings: Booking[]) => {
    try {
      await AsyncStorage.setItem('bookings', JSON.stringify(newBookings));
    } catch (error) {
      console.error('Failed to save bookings:', error);
    }
  };

  const saveRecurringServices = async (services: RecurringService[]) => {
    try {
      await AsyncStorage.setItem('recurringServices', JSON.stringify(services));
    } catch (error) {
      console.error('Failed to save recurring services:', error);
    }
  };

  const addBooking = (booking: Omit<Booking, 'id'>) => {
    const newBooking: Booking = {
      ...booking,
      id: Date.now().toString()
    };
    const newBookings = [...bookings, newBooking];
    setBookings(newBookings);
    saveBookings(newBookings);
    return newBooking;
  };

  const cancelBooking = (bookingId: string) => {
    const newBookings = bookings.map(booking =>
      booking.id === bookingId ? { ...booking, status: 'cancelled' as const } : booking
    );
    setBookings(newBookings);
    saveBookings(newBookings);
  };

  const getUpcomingBookings = () => {
    return bookings.filter(b => b.status === 'upcoming');
  };

  const getPastBookings = () => {
    return bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  };

  const addRecurringService = (service: Omit<RecurringService, 'id'>) => {
    const newService: RecurringService = {
      ...service,
      id: Date.now().toString()
    };
    const newServices = [...recurringServices, newService];
    setRecurringServices(newServices);
    saveRecurringServices(newServices);
    return newService;
  };

  const updateRecurringService = (serviceId: string, updates: Partial<RecurringService>) => {
    const newServices = recurringServices.map(service =>
      service.id === serviceId ? { ...service, ...updates } : service
    );
    setRecurringServices(newServices);
    saveRecurringServices(newServices);
  };

  const pauseRecurringService = (serviceId: string) => {
    updateRecurringService(serviceId, { status: 'paused' });
  };

  const resumeRecurringService = (serviceId: string) => {
    updateRecurringService(serviceId, { status: 'active' });
  };

  const cancelRecurringService = (serviceId: string) => {
    updateRecurringService(serviceId, { status: 'cancelled' });
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