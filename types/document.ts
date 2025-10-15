export interface Document {
  id: string;
  title: string;
  category: DocumentCategory;
  type: string;
  description?: string;
  tags: string[];
  image_url?: string;
  file_url?: string;
  image_storage_path?: string;  // Add this
  file_storage_path?: string;   // Add this
  file_name?: string;
  file_type?: string;
  file_size?: number;
  is_important: boolean;
  reminder_date?: string;
  expiration_date?: string;
  property_id?: string;
  user_id: string;
  size?: string;
  created_at: string;
  updated_at: string;
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