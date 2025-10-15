import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Document, DocumentCategory } from '@/types/document';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-store';
import { uploadImage, uploadDocument, deleteFileFromSupabase, formatFileSize } from '@/utils/fileUpload';

export const [VaultProvider, useVault] = createContextHook(() => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    if (!user?.id) {
      console.log('[Vault] No user ID, clearing documents');
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('[Vault] Loading documents for user:', user.id);
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Vault] Supabase error:', error);
        throw error;
      }

      console.log('[Vault] Documents loaded:', data?.length || 0);
      setDocuments(data || []);
    } catch (error) {
      console.error('[Vault] Error loading documents:', error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDocuments();

    if (!user?.id) return;

    console.log('[Vault] Setting up realtime subscription');
    
    const channel = supabase
      .channel('documents_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'documents',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('[Vault] Realtime update:', payload.eventType);
          loadDocuments();
        }
      )
      .subscribe();

    return () => {
      console.log('[Vault] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [loadDocuments, user?.id]);

  const addDocument = useCallback(async (document: Omit<Document, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user?.id) {
      throw new Error('No user logged in');
    }

    try {
      console.log('[Vault] Adding document:', document.title);

      let imageUrl = document.image_url;
      let fileUrl = document.file_url;
      let imageStoragePath: string | undefined;
      let fileStoragePath: string | undefined;
      let fileSize: number | undefined;
      let fileType: string | undefined;
      let fileName: string | undefined;

      // Upload image if local file
      if (imageUrl && imageUrl.startsWith('file://')) {
        console.log('[Vault] Uploading image...');
        const result = await uploadImage(imageUrl, user.id);
        imageUrl = result.url;
        imageStoragePath = result.path;
        console.log('[Vault] Image uploaded:', result.path);
      }

      // Upload document if local file
      if (fileUrl && fileUrl.startsWith('file://')) {
        console.log('[Vault] Uploading document...');
        const result = await uploadDocument(fileUrl, user.id, document.file_name);
        fileUrl = result.url;
        fileStoragePath = result.path;
        fileSize = result.size;
        fileType = result.type;
        fileName = document.file_name || result.path.split('/').pop();
        console.log('[Vault] Document uploaded:', result.path);
      }

      // Prepare document data
      const documentData = {
        user_id: user.id,
        title: document.title,
        category: document.category,
        type: document.type,
        description: document.description || null,
        tags: document.tags || [],
        image_url: imageUrl || null,
        file_url: fileUrl || null,
        image_storage_path: imageStoragePath || null,
        file_storage_path: fileStoragePath || null,
        file_name: fileName || document.file_name || null,
        file_type: fileType || document.file_type || null,
        file_size: fileSize || document.file_size || null,
        size: fileSize ? formatFileSize(fileSize) : null,
        is_important: document.is_important || false,
        expiration_date: document.expiration_date || null,
        reminder_date: document.reminder_date || null,
        property_id: document.property_id || null,
      };

      console.log('[Vault] Inserting to database...');

      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single();

      if (error) {
        console.error('[Vault] Database error:', error);
        
        // Cleanup uploaded files on error
        if (imageStoragePath) {
          await deleteFileFromSupabase('document-images', imageStoragePath).catch(console.error);
        }
        if (fileStoragePath) {
          await deleteFileFromSupabase('documents', fileStoragePath).catch(console.error);
        }
        
        throw error;
      }

      console.log('[Vault] Document added successfully');
      setDocuments(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('[Vault] Error adding document:', error);
      throw error;
    }
  }, [user?.id]);

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    if (!user?.id) {
      throw new Error('No user logged in');
    }

    try {
      console.log('[Vault] Updating document:', id);
      
      const existing = documents.find(doc => doc.id === id);
      if (!existing) {
        throw new Error('Document not found');
      }

      let imageUrl = updates.image_url;
      let fileUrl = updates.file_url;
      let imageStoragePath = existing.image_storage_path;
      let fileStoragePath = existing.file_storage_path;
      let fileSize = updates.file_size;
      let fileType = updates.file_type;
      let fileName = updates.file_name;

      // Upload new image if changed
      if (imageUrl && imageUrl.startsWith('file://')) {
        const result = await uploadImage(imageUrl, user.id);
        imageUrl = result.url;
        imageStoragePath = result.path;
        
        // Delete old image
        if (existing.image_storage_path) {
          await deleteFileFromSupabase('document-images', existing.image_storage_path).catch(console.error);
        }
      }

      // Upload new file if changed
      if (fileUrl && fileUrl.startsWith('file://')) {
        const result = await uploadDocument(fileUrl, user.id, updates.file_name);
        fileUrl = result.url;
        fileStoragePath = result.path;
        fileSize = result.size;
        fileType = result.type;
        fileName = updates.file_name || result.path.split('/').pop();
        
        // Delete old file
        if (existing.file_storage_path) {
          await deleteFileFromSupabase('documents', existing.file_storage_path).catch(console.error);
        }
      }

      const updateData = {
        ...updates,
        image_url: imageUrl,
        file_url: fileUrl,
        image_storage_path: imageStoragePath,
        file_storage_path: fileStoragePath,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        size: fileSize ? formatFileSize(fileSize) : existing.size,
      };

      const { data, error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setDocuments(prev => prev.map(doc => doc.id === id ? data : doc));
      return data;
    } catch (error) {
      console.error('[Vault] Error updating document:', error);
      throw error;
    }
  }, [user?.id, documents]);

  const deleteDocument = useCallback(async (id: string) => {
    if (!user?.id) {
      throw new Error('No user logged in');
    }

    try {
      console.log('[Vault] Deleting document:', id);
      
      const doc = documents.find(d => d.id === id);

      // Delete files from storage
      if (doc?.image_storage_path) {
        await deleteFileFromSupabase('document-images', doc.image_storage_path).catch(console.error);
      }
      if (doc?.file_storage_path) {
        await deleteFileFromSupabase('documents', doc.file_storage_path).catch(console.error);
      }

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.id !== id));
      return true;
    } catch (error) {
      console.error('[Vault] Error deleting document:', error);
      throw error;
    }
  }, [user?.id, documents]);

  const getDocumentsByCategory = useCallback((category: DocumentCategory) => {
    return documents.filter(doc => doc.category === category);
  }, [documents]);

  const getImportantDocuments = useCallback(() => {
    return documents.filter(doc => doc.is_important);
  }, [documents]);

  const getExpiringDocuments = useCallback((days: number = 30) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return documents.filter(doc => {
      if (!doc.expiration_date) return false;
      const expDate = new Date(doc.expiration_date);
      return expDate <= futureDate && expDate >= new Date();
    });
  }, [documents]);

  const searchDocuments = useCallback((query: string) => {
    if (!query?.trim()) return documents;
    const q = query.toLowerCase().trim();
    return documents.filter(doc =>
      doc.title.toLowerCase().includes(q) ||
      doc.description?.toLowerCase().includes(q) ||
      doc.tags.some(tag => tag.toLowerCase().includes(q))
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
    refresh: loadDocuments,
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
    loadDocuments,
  ]);
});