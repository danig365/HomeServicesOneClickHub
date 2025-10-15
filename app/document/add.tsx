import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useVault } from '@/hooks/vault-store';
import { useProperties } from '@/hooks/properties-store';
import { DocumentCategory } from '@/types/document';
import DocumentForm from '@/components/DocumentForm';

export default function AddDocumentScreen() {
  const { addDocument } = useVault();
  const { selectedPropertyId } = useProperties();

  const handleSubmit = async (formData: any) => {
    await addDocument({
      ...formData,
      category: formData.category as DocumentCategory,
      // Only add property_id if a specific property is selected (not 'all')
      property_id: selectedPropertyId && selectedPropertyId !== 'all' ? selectedPropertyId : undefined,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Add Document' }} />
      <DocumentForm onSubmit={handleSubmit} mode="add" />
    </View>
  );
}