// Appointment types for homeowners (based on hudson_visits table)
export type AppointmentType = 'monthly-maintenance' | 'snapshot-inspection';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  propertyId: string;
  propertyName?: string;
  propertyAddress?: string;
  scheduledDate: string;
  completedDate?: string;
  status: AppointmentStatus;
  type: AppointmentType;
  techName: string;
  notes?: string;
  photos: string[];
  nextVisitDate?: string;
  // Associated data
  tasks?: MaintenanceTask[];
  snapshotId?: string;
}

export interface MaintenanceTask {
  id: string;
  visitId: string;
  name: string;
  description: string;
  category: 'standard' | 'seasonal' | 'custom';
  month?: number;
  estimatedDuration: string;
  completed: boolean;
}

// Database types
export interface AppointmentDB {
  id: string;
  subscription_id: string | null;
  property_id: string;
  scheduled_date: string;
  completed_date: string | null;
  status: AppointmentStatus;
  type: AppointmentType;
  hudson_name: string;
  notes: string | null;
  photos: string[];
  next_visit_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceTaskDB {
  id: string;
  visit_id: string;
  name: string;
  description: string;
  category: 'standard' | 'seasonal' | 'custom';
  month: number | null;
  estimated_duration: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to convert DB to legacy format
export function toAppointment(
  db: AppointmentDB,
  tasks?: MaintenanceTaskDB[],
  propertyName?: string,
  propertyAddress?: string
): Appointment {
  return {
    id: db.id,
    propertyId: db.property_id,
    propertyName,
    propertyAddress,
    scheduledDate: db.scheduled_date,
    completedDate: db.completed_date || undefined,
    status: db.status,
    type: db.type,
    techName: db.hudson_name,
    notes: db.notes || undefined,
    photos: db.photos || [],
    nextVisitDate: db.next_visit_date || undefined,
    tasks: tasks?.map(t => ({
      id: t.id,
      visitId: t.visit_id,
      name: t.name,
      description: t.description,
      category: t.category,
      month: t.month || undefined,
      estimatedDuration: t.estimated_duration,
      completed: t.completed,
    })),
  };
}