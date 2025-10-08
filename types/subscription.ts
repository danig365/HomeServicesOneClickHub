export interface CustomProject {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedCost?: string;
  targetDate?: string;
  status: 'planned' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  createdByRole?: 'tech' | 'homeowner' | 'admin';
  completedDate?: string;
  actualCost?: string;
  notes?: string;
}

export interface MonthlyVisitRequest {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string;
  createdAt: string;
}

export interface YearlyPlanItem {
  id: string;
  year: number;
  month: number;
  title: string;
  description: string;
  category: 'maintenance' | 'upgrade' | 'repair' | 'inspection' | 'seasonal' | 'project';
  estimatedCost?: string;
  priority: 'low' | 'medium' | 'high';
  dependencies?: string[];
  notes?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'skipped';
  completedDate?: string;
  actualCost?: string;
  createdBy: string;
  createdByRole: 'tech' | 'homeowner' | 'admin';
  createdAt: string;
  updatedAt?: string;
  photos?: string[];
  techNotes?: string;
  homeownerNotes?: string;
}

export interface FiveYearPlan {
  id: string;
  propertyId: string;
  blueprintId: string;
  createdAt: string;
  updatedAt: string;
  generatedByAI: boolean;
  items: YearlyPlanItem[];
  summary: string;
  totalEstimatedCost?: string;
  keyMilestones: string[];
}

export interface BlueprintHistoryEntry {
  id: string;
  timestamp: string;
  action: 'created' | 'updated' | 'project_added' | 'project_updated' | 'project_completed' | 'plan_item_added' | 'plan_item_updated' | 'plan_item_completed' | 'plan_item_removed';
  description: string;
  userId: string;
  userName: string;
  userRole: 'tech' | 'homeowner' | 'admin';
  changes?: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
  relatedItemId?: string;
  relatedItemType?: 'project' | 'plan_item' | 'goal' | 'priority';
}

export interface BlueprintNotification {
  id: string;
  blueprintId: string;
  propertyId: string;
  timestamp: string;
  type: 'user_update' | 'tech_update' | 'project_added' | 'project_completed' | 'plan_modified';
  message: string;
  userId: string;
  userName: string;
  userRole: 'tech' | 'homeowner' | 'admin';
  read: boolean;
  recipientRole: 'tech' | 'homeowner' | 'admin';
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
  fiveYearPlan?: FiveYearPlan;
  history: BlueprintHistoryEntry[];
  notifications: BlueprintNotification[];
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
