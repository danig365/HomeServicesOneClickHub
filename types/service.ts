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