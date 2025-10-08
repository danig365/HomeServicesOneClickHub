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
