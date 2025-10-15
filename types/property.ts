// Property types matching Supabase schema
export type PropertyType = 'primary' | 'secondary' | 'rental' | 'vacation';

export interface Property {
  id: string;
  user_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  type: PropertyType;
  image_url?: string | null;
  is_primary: boolean;
  purchase_date?: string | null;
  square_feet?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Client-side only fields (not in DB)
  insights?: PropertyInsight[];
  reminders?: PropertyReminder[];
}

// For creating/updating properties (without DB-managed fields)
export interface PropertyInput {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  type: PropertyType;
  image_url?: string | null;
  is_primary: boolean;
  purchase_date?: string | null;
  square_feet?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  notes?: string | null;
}

export interface PropertyInsight {
  id: string;
  property_id: string;
  label: string;
  last_updated: string;
  icon: string;
  color: string;
  recommended_interval: number;
  notes?: string | null;
  updated_by?: string | null;
  updated_by_role?: 'tech' | 'homeowner' | 'admin' | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyInsightInput {
  label: string;
  last_updated: string;
  icon: string;
  color: string;
  recommended_interval: number;
  notes?: string | null;
  updated_by?: string | null;
  updated_by_role?: 'tech' | 'homeowner' | 'admin' | null;
}

export interface PropertyReminder {
  id: string;
  property_id: string;
  title: string;
  description?: string | null;
  due_date: string;
  type: 'maintenance' | 'inspection' | 'payment' | 'renewal' | 'custom';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completed_date?: string | null;
  recurring: boolean;
  recurring_interval?: number | null;
  created_by?: string | null;
  created_by_role?: 'tech' | 'homeowner' | 'admin' | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyReminderInput {
  title: string;
  description?: string | null;
  due_date: string;
  type: 'maintenance' | 'inspection' | 'payment' | 'renewal' | 'custom';
  priority: 'low' | 'medium' | 'high';
  recurring: boolean;
  recurring_interval?: number | null;
  created_by?: string | null;
  created_by_role?: 'tech' | 'homeowner' | 'admin' | null;
}

// Legacy type support for backwards compatibility with existing code
export type LegacyProperty = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: PropertyType;
  isPrimary: boolean;
  imageUrl?: string;
  purchaseDate?: string;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  notes?: string;
  insights?: {
    id: string;
    label: string;
    lastUpdated: string;
    icon: string;
    color: string;
    recommendedInterval?: number;
    notes?: string;
    updatedBy?: string;
    updatedByRole?: 'tech' | 'homeowner' | 'admin';
  }[];
  reminders?: {
    id: string;
    propertyId: string;
    title: string;
    description?: string;
    dueDate: string;
    type: 'maintenance' | 'inspection' | 'payment' | 'renewal' | 'custom';
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    completedDate?: string;
    recurring: boolean;
    recurringInterval?: number;
    createdBy?: string;
    createdByRole?: 'tech' | 'homeowner' | 'admin';
  }[];
};

// Helper functions to convert between DB and legacy formats
export function toLegacyProperty(dbProperty: Property, insights?: PropertyInsight[], reminders?: PropertyReminder[]): LegacyProperty {
  return {
    id: dbProperty.id,
    name: dbProperty.name,
    address: dbProperty.address,
    city: dbProperty.city,
    state: dbProperty.state,
    zipCode: dbProperty.zip_code,
    type: dbProperty.type,
    isPrimary: dbProperty.is_primary,
    imageUrl: dbProperty.image_url || undefined,
    purchaseDate: dbProperty.purchase_date || undefined,
    squareFeet: dbProperty.square_feet || undefined,
    bedrooms: dbProperty.bedrooms || undefined,
    bathrooms: dbProperty.bathrooms || undefined,
    notes: dbProperty.notes || undefined,
    insights: insights?.map(i => ({
      id: i.id,
      label: i.label,
      lastUpdated: i.last_updated,
      icon: i.icon,
      color: i.color,
      recommendedInterval: i.recommended_interval,
      notes: i.notes || undefined,
      updatedBy: i.updated_by || undefined,
      updatedByRole: i.updated_by_role || undefined,
    })),
    reminders: reminders?.map(r => ({
      id: r.id,
      propertyId: r.property_id,
      title: r.title,
      description: r.description || undefined,
      dueDate: r.due_date,
      type: r.type,
      priority: r.priority,
      completed: r.completed,
      completedDate: r.completed_date || undefined,
      recurring: r.recurring,
      recurringInterval: r.recurring_interval || undefined,
      createdBy: r.created_by || undefined,
      createdByRole: r.created_by_role || undefined,
    })),
  };
}

export function toDbPropertyInput(legacyProperty: Partial<LegacyProperty>): Partial<PropertyInput> {
  return {
    name: legacyProperty.name,
    address: legacyProperty.address,
    city: legacyProperty.city,
    state: legacyProperty.state,
    zip_code: legacyProperty.zipCode,
    type: legacyProperty.type,
    is_primary: legacyProperty.isPrimary,
    image_url: legacyProperty.imageUrl,
    purchase_date: legacyProperty.purchaseDate,
    square_feet: legacyProperty.squareFeet,
    bedrooms: legacyProperty.bedrooms,
    bathrooms: legacyProperty.bathrooms,
    notes: legacyProperty.notes,
  };
}