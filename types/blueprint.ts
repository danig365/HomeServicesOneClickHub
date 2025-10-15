export type BlueprintHistoryAction = 
  | 'created' 
  | 'updated' 
  | 'item_added'
  | 'item_updated'
  | 'item_completed'
  | 'item_deleted';

export interface Blueprint {
  id: string;
  property_id: string;
  subscription_id: string;
  five_year_goals: string[];
  priority_areas: string[];
  budget_range: string;
  timeline: string;
  created_at: string;
  updated_at: string;
}

export interface FiveYearPlan {
  id: string;
  property_id: string;
  blueprint_id: string;
  summary: string;
  total_estimated_cost: string;
  key_milestones: string[];
  generated_by_ai: boolean;
  created_at: string;
  updated_at: string;
  items?: YearlyPlanItem[];
}

export interface YearlyPlanItem {
  id: string;
  plan_id: string;
  year: number;
  month: number;
  title: string;
  description: string;
  category: 'maintenance' | 'upgrade' | 'repair' | 'inspection' | 'seasonal' | 'project';
  estimated_cost?: string;
  priority: 'low' | 'medium' | 'high';
  dependencies?: string[];
  notes?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'skipped';
  completed_date?: string;
  actual_cost?: string;
  photos?: string[];
  tech_notes?: string;
  homeowner_notes?: string;
  created_by: string;
  created_by_role: 'tech' | 'homeowner' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface CustomProject {
  id: string;
  blueprint_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimated_cost?: string;
  target_date?: string;
  status: 'planned' | 'in-progress' | 'completed';
  completed_date?: string;
  actual_cost?: string;
  notes?: string;
  created_by?: string;
  created_by_role?: 'tech' | 'homeowner' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface MonthlyVisitRequest {
  id: string;
  blueprint_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimated_time: string;
  created_at: string;
}

export interface BlueprintHistory {
  id: string;
  blueprint_id: string;
  action: BlueprintHistoryAction;
  description: string;
  user_id: string;
  user_name: string;
  user_role: 'tech' | 'homeowner' | 'admin';
  related_item_id?: string;
  related_item_type?: string;
  changes?: any;
  created_at: string;
}

export interface BlueprintNotification {
  id: string;
  blueprint_id: string;
  property_id: string;
  type: string;
  message: string;
  user_id: string;
  user_name: string;
  user_role: 'tech' | 'homeowner' | 'admin';
  recipient_role: 'tech' | 'homeowner' | 'admin';
  read: boolean;
  created_at: string;
}
