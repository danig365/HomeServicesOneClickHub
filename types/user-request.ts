export type RequestType = 'custom_service' | 'blueprint_modification' | 'maintenance_support' | 'general_inquiry';
export type RequestStatus = 'pending' | 'in-review' | 'approved' | 'rejected' | 'completed';
export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface UserRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  propertyId: string;
  propertyName: string;
  type: RequestType;
  status: RequestStatus;
  priority: RequestPriority;
  title: string;
  description: string;
  attachments?: string[];
  estimatedCost?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  completedAt?: string;
  assignedTechId?: string;
  assignedTechName?: string;
}

export interface BlueprintModificationRequest extends UserRequest {
  type: 'blueprint_modification';
  blueprintId: string;
  requestedChanges: {
    field: string;
    currentValue?: any;
    requestedValue: any;
    reason: string;
  }[];
}

export interface CustomServiceRequest extends UserRequest {
  type: 'custom_service';
  serviceCategory: string;
  frequency?: 'one-time' | 'monthly' | 'quarterly' | 'bi-annual' | 'annual';
  preferredSchedule?: string;
}
