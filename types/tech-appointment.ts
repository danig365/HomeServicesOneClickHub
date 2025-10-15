export type AppointmentType = 'standard' | 'snapshot';
export type AppointmentStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface MediaNote {
  id: string;
  type: 'image' | 'audio';
  uri: string;
  timestamp: string;
  notes?: string;
  location?: string;
}

export interface ApplianceDetail {
  id: string;
  name: string;
  serialNumber?: string;
  modelNumber?: string;
  filterType?: string;
  filterSize?: string;
  lastServiceDate?: string;
  notes?: string;
}

export interface RoomInspection {
  id: string;
  roomName: string;
  roomType: 'kitchen' | 'bathroom' | 'bedroom' | 'living' | 'dining' | 'laundry' | 'garage' | 'basement' | 'attic' | 'other';
  score: number;
  notes: string;
  images: MediaNote[];
  audioNotes: MediaNote[];
  issues: string[];
  recommendations: string[];
  appliances?: ApplianceDetail[];
}

export interface SnapshotInspection {
  id: string;
  propertyId?: string;
  appointmentId: string;
  rooms: RoomInspection[];
  overallScore: number;
  structuralScore: number;
  mechanicalScore: number;
  aestheticScore: number;
  efficiencyScore: number;
  safetyScore: number;
  generalNotes: string;
  generalImages: MediaNote[];
  generalAudioNotes: MediaNote[];
  completedAt?: string;
  techId: string;
}

export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'seasonal' | 'custom';
  completed: boolean;
  completedAt?: string;
  notes?: string;
  images?: MediaNote[];
  audioNotes?: MediaNote[];
  estimatedDuration: string;
}

export interface TechAppointment {
  id: string;
  propertyId: string;
  techId: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  tasks: MaintenanceTask[];
  notes: string;
  images: MediaNote[];
  audioNotes: MediaNote[];
  snapshotInspection?: SnapshotInspection;
  userRequests?: string[];
}

// ADD: Database types for Supabase
export interface HudsonVisitDB {
  id: string;
  subscription_id: string | null; // nullable for now
  property_id: string;
  scheduled_date: string;
  completed_date?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: 'monthly-maintenance' | 'snapshot-inspection';
  hudson_name: string;
  notes?: string | null;
  photos: string[];
  next_visit_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceTaskDB {
  id: string;
  visit_id: string;
  name: string;
  description: string;
  category: 'standard' | 'seasonal' | 'custom';
  month?: number | null;
  estimated_duration: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SnapshotInspectionDB {
  id: string;
  subscription_id: string | null; // nullable for now
  property_id: string;
  visit_id?: string | null;
  tech_id: string;
  tech_name: string;
  scheduled_date: string;
  completed_date?: string | null;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  overall_notes?: string | null;
  overall_images: string[];
  overall_audio_notes: string[];
  consultation_notes?: string | null;
  homeowner_priorities: string[];
  estimated_duration: string;
  actual_duration?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoomInspectionDB {
  id: string;
  snapshot_id: string;
  room_name: string;
  room_type: 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'dining' | 'garage' | 'basement' | 'attic' | 'laundry' | 'office' | 'other';
  score?: number | null;
  notes?: string | null;
  images: string[];
  audio_notes: string[];
  recommendations: string[];
  created_at: string;
  updated_at: string;
}
