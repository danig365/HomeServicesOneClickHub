export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'bi-annual' | 'annual';
  description: string;
  icon: string;
  popular?: boolean;
  requiresLicense?: boolean;
  estimatedDuration: string;
  included: string[];
  image: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  price: number;
  address: string;
  providerName?: string;
  propertyId?: string;
}

export interface CartItem {
  service: Service;
  quantity: number;
  scheduledDate?: string;
  propertyId?: string;
}

export interface RecurringService {
  id: string;
  serviceId: string;
  serviceName: string;
  frequency: 'monthly' | 'quarterly' | 'bi-annual' | 'annual';
  price: number;
  startDate: string;
  nextServiceDate: string;
  status: 'active' | 'paused' | 'cancelled';
  autoRenew: boolean;
  propertyId?: string;
}
// Database types for Supabase
export interface BookingDB {
  id: string;
  user_id: string;
  property_id: string;
  service_id: string;
  service_name: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  price: number;
  provider_name?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringServiceDB {
  id: string;
  user_id: string;
  property_id: string;
  service_id: string;
  service_name: string;
  frequency: 'monthly' | 'quarterly' | 'bi-annual' | 'annual';
  price: number;
  start_date: string;
  next_service_date: string;
  status: 'active' | 'paused' | 'cancelled';
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}