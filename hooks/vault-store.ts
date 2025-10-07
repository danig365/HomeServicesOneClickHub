import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Document, DocumentCategory } from '@/types/document';
import { Platform } from 'react-native';

// Simple storage abstraction
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (!key?.trim()) return null;
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    // For native, use a simple in-memory store for demo
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (!key?.trim() || !value) return;
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    }
    // For native, use a simple in-memory store for demo
  },
};

const STORAGE_KEY = 'hudson_vault_documents';

// Mock data for demonstration
const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Home Insurance Policy',
    category: 'Insurance',
    type: 'PDF',
    dateAdded: '2024-01-15',
    dateModified: '2024-01-15',
    size: '2.4 MB',
    description: 'Comprehensive home insurance policy covering property and liability',
    tags: ['insurance', 'policy', 'coverage'],
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    isImportant: true,
    expirationDate: '2024-12-31',
    propertyId: '1',
  },
  {
    id: '2',
    title: 'Property Deed',
    category: 'Property Records',
    type: 'PDF',
    dateAdded: '2024-01-10',
    dateModified: '2024-01-10',
    size: '1.8 MB',
    description: 'Official property deed and ownership documents',
    tags: ['deed', 'ownership', 'legal'],
    imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
    isImportant: true,
    propertyId: '1',
  },
  {
    id: '3',
    title: 'HVAC System Warranty',
    category: 'Warranties',
    type: 'PDF',
    dateAdded: '2024-02-01',
    dateModified: '2024-02-01',
    size: '856 KB',
    description: '10-year warranty for HVAC system installation',
    tags: ['hvac', 'warranty', 'heating', 'cooling'],
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    isImportant: false,
    expirationDate: '2034-02-01',
    propertyId: '1',
  },
  {
    id: '4',
    title: 'Annual Maintenance Report',
    category: 'Maintenance',
    type: 'PDF',
    dateAdded: '2024-03-15',
    dateModified: '2024-03-15',
    size: '1.2 MB',
    description: 'Comprehensive home maintenance inspection report',
    tags: ['maintenance', 'inspection', 'report'],
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    isImportant: false,
    reminderDate: '2025-03-15',
    propertyId: '1',
  },
  {
    id: '5',
    title: 'Electrical Permit',
    category: 'Permits',
    type: 'PDF',
    dateAdded: '2024-02-20',
    dateModified: '2024-02-20',
    size: '654 KB',
    description: 'Electrical work permit for kitchen renovation',
    tags: ['permit', 'electrical', 'renovation'],
    imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400',
    isImportant: false,
    propertyId: '1',
  },
  {
    id: '6',
    title: 'Beach House Insurance',
    category: 'Insurance',
    type: 'PDF',
    dateAdded: '2024-01-20',
    dateModified: '2024-01-20',
    size: '2.1 MB',
    description: 'Vacation home insurance policy',
    tags: ['insurance', 'beach', 'vacation'],
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    isImportant: true,
    expirationDate: '2024-12-31',
    propertyId: '2',
  },
  {
    id: '7',
    title: 'Beach House Deed',
    category: 'Property Records',
    type: 'PDF',
    dateAdded: '2024-01-12',
    dateModified: '2024-01-12',
    size: '1.5 MB',
    description: 'Beach property deed and ownership documents',
    tags: ['deed', 'ownership', 'beach'],
    imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
    isImportant: true,
    propertyId: '2',
  },
  {
    id: '8',
    title: 'Pool Equipment Warranty',
    category: 'Warranties',
    type: 'PDF',
    dateAdded: '2024-02-05',
    dateModified: '2024-02-05',
    size: '720 KB',
    description: '5-year warranty for pool pump and filter system',
    tags: ['pool', 'warranty', 'equipment'],
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    isImportant: false,
    expirationDate: '2029-02-05',
    propertyId: '2',
  },
];

export const [VaultProvider, useVault] = createContextHook(() => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    try {
      const stored = await storage.getItem(STORAGE_KEY);
      if (stored) {
        setDocuments(JSON.parse(stored));
      } else {
        // Initialize with mock data
        setDocuments(mockDocuments);
        await storage.setItem(STORAGE_KEY, JSON.stringify(mockDocuments));
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments(mockDocuments);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load documents from storage
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const saveDocuments = useCallback(async (newDocuments: Document[]) => {
    if (!newDocuments || !Array.isArray(newDocuments) || newDocuments.length === 0) {
      setDocuments([]);
      return;
    }
    try {
      const serialized = JSON.stringify(newDocuments);
      if (serialized.length > 0) {
        await storage.setItem(STORAGE_KEY, serialized);
        setDocuments(newDocuments);
      }
    } catch (error) {
      console.error('Error saving documents:', error);
    }
  }, []);

  const addDocument = useCallback(async (document: Omit<Document, 'id' | 'dateAdded' | 'dateModified'>) => {
    if (!document.title?.trim()) return;
    const newDocument: Document = {
      ...document,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString().split('T')[0],
      dateModified: new Date().toISOString().split('T')[0],
    };
    
    const updatedDocuments = [...documents, newDocument];
    await saveDocuments(updatedDocuments);
  }, [documents, saveDocuments]);

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    if (!id?.trim()) return;
    const updatedDocuments = documents.map(doc =>
      doc.id === id
        ? { ...doc, ...updates, dateModified: new Date().toISOString().split('T')[0] }
        : doc
    );
    await saveDocuments(updatedDocuments);
  }, [documents, saveDocuments]);

  const deleteDocument = useCallback(async (id: string) => {
    if (!id?.trim()) return;
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    await saveDocuments(updatedDocuments);
  }, [documents, saveDocuments]);

  const getDocumentsByCategory = useCallback((category: DocumentCategory) => {
    return documents.filter(doc => doc.category === category);
  }, [documents]);

  const getImportantDocuments = useCallback(() => {
    return documents.filter(doc => doc.isImportant);
  }, [documents]);

  const getExpiringDocuments = useCallback((days: number = 30) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return documents.filter(doc => {
      if (!doc.expirationDate) return false;
      const expDate = new Date(doc.expirationDate);
      return expDate <= futureDate && expDate >= new Date();
    });
  }, [documents]);

  const searchDocuments = useCallback((query: string) => {
    if (!query?.trim()) return documents;
    const lowercaseQuery = query.toLowerCase().trim();
    return documents.filter(doc =>
      doc.title.toLowerCase().includes(lowercaseQuery) ||
      doc.description?.toLowerCase().includes(lowercaseQuery) ||
      doc.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [documents]);

  return useMemo(() => ({
    documents,
    isLoading,
    addDocument,
    updateDocument,
    deleteDocument,
    getDocumentsByCategory,
    getImportantDocuments,
    getExpiringDocuments,
    searchDocuments,
  }), [
    documents,
    isLoading,
    addDocument,
    updateDocument,
    deleteDocument,
    getDocumentsByCategory,
    getImportantDocuments,
    getExpiringDocuments,
    searchDocuments,
  ]);
});