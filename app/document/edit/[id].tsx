import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useVault } from '@/hooks/vault-store';
import { DocumentCategory } from '@/types/document';
import DocumentForm from '@/components/DocumentForm';

export default function EditDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { documents, updateDocument } = useVault();
  const document = documents.find(doc => doc.id === id);

  if (!document) {
    return (
      <View style={{ flex: 1 }}>
        <Stack.Screen options={{ title: 'Document Not Found' }} />
        <Text>Document not found</Text>
      </View>
    );
  }

  const handleUpdate = async (formData: any) => {
    await updateDocument(id, {
      ...formData,
      category: formData.category as DocumentCategory,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Edit Document' }} />
      <DocumentForm 
        initialData={document}
        onSubmit={handleUpdate}
        mode="edit"
      />
    </View>
  );
}
