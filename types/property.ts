export interface PropertyReminder {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  type: 'maintenance' | 'inspection' | 'payment' | 'renewal' | 'custom';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completedDate?: string;
  recurring?: boolean;
  recurringInterval?: number;
  propertyId: string;
  createdBy?: string;
  createdByRole?: 'tech' | 'homeowner' | 'admin';
}

export interface PropertyInsight {
  id: string;
  label: string;
  lastUpdated: string;
  icon: string;
  color: string;
  recommendedInterval?: number;
  notes?: string;
  updatedBy?: string;
  updatedByRole?: 'tech' | 'homeowner' | 'admin';
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: 'primary' | 'secondary' | 'rental' | 'vacation';
  imageUrl?: string;
  isPrimary: boolean;
  purchaseDate?: string;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  notes?: string;
  insights?: PropertyInsight[];
  reminders?: PropertyReminder[];
}
