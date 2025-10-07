export interface CustomProject {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedCost?: string;
  targetDate?: string;
  status: 'planned' | 'in-progress' | 'completed';
  createdAt: string;
}

export interface MonthlyVisitRequest {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string;
  createdAt: string;
}

export interface MyHomeBlueprint {
  id: string;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
  fiveYearGoals: string[];
  priorityAreas: string[];
  customProjects: CustomProject[];
  monthlyVisitRequests: MonthlyVisitRequest[];
  budgetRange?: string;
  timeline?: string;
}

export interface MyHomeScore {
  id: string;
  propertyId: string;
  score: number;
  quarter: string;
  year: number;
  categories: {
    structural: number;
    mechanical: number;
    aesthetic: number;
    efficiency: number;
    safety: number;
  };
  improvements: string[];
  recommendations: string[];
  createdAt: string;
}

export interface MonthlyMaintenanceTask {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'seasonal' | 'custom';
  month: number;
  estimatedDuration: string;
  completed: boolean;
}

export interface RoomInspection {
  id: string;
  roomName: string;
  roomType: 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'dining' | 'garage' | 'basement' | 'attic' | 'laundry' | 'office' | 'other';
  score: number;
  notes: string;
  images: string[];
  audioNotes: string[];
  issues: {
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    category: 'structural' | 'mechanical' | 'aesthetic' | 'efficiency' | 'safety';
  }[];
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SnapshotInspection {
  id: string;
  propertyId: string;
  techId: string;
  techName: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  rooms: RoomInspection[];
  overallNotes: string;
  overallImages: string[];
  overallAudioNotes: string[];
  consultationNotes: string;
  homeownerPriorities: string[];
  estimatedDuration: string;
  actualDuration?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HudsonVisit {
  id: string;
  propertyId: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: 'monthly-maintenance' | 'snapshot-inspection';
  hudsonName: string;
  tasks: MonthlyMaintenanceTask[];
  notes?: string;
  photos?: string[];
  nextVisitDate?: string;
  snapshotInspection?: SnapshotInspection;
}

export interface Subscription {
  id: string;
  propertyId: string;
  status: 'active' | 'inactive' | 'cancelled';
  startDate: string;
  nextBillingDate: string;
  monthlyPrice: number;
  blueprint?: MyHomeBlueprint;
  currentScore?: MyHomeScore;
  visits: HudsonVisit[];
  snapshotInspections: SnapshotInspection[];
  hasCompletedSnapshot: boolean;
  personalDirector: {
    name: string;
    phone: string;
    email: string;
    photo?: string;
  };
}
