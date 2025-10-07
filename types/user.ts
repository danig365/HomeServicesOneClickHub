export type UserRole = 'admin' | 'tech' | 'homeowner';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  photo?: string;
  assignedProperties?: string[];
}

export interface TechAssignment {
  techId: string;
  propertyId: string;
  assignedDate: string;
  status: 'active' | 'inactive';
}
