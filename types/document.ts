export interface Document {
  id: string;
  title: string;
  category: DocumentCategory;
  type: string;
  dateAdded: string;
  dateModified: string;
  size?: string;
  description?: string;
  tags: string[];
  imageUrl?: string;
  fileUrl?: string;
  isImportant: boolean;
  reminderDate?: string;
  expirationDate?: string;
  propertyId?: string;
}

export type DocumentCategory = 
  | 'Property Records'
  | 'Insurance'
  | 'Warranties'
  | 'Maintenance'
  | 'Utilities'
  | 'Permits'
  | 'Inspections'
  | 'Financial'
  | 'Legal'
  | 'Other';

export interface DocumentFolder {
  id: string;
  name: string;
  category: DocumentCategory;
  icon: string;
  color: string;
  documentCount: number;
}