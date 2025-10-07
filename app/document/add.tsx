import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import { useVault } from '@/hooks/vault-store';
import { DocumentCategory } from '@/types/document';
import { COLORS } from '@/constants/colors';

const categoryOptions: { label: string; value: DocumentCategory; icon: string; color: string }[] = [
  { label: 'Property Records', value: 'Property Records', icon: 'Home', color: '#1E3A8A' },
  { label: 'Insurance', value: 'Insurance', icon: 'Shield', color: '#059669' },
  { label: 'Warranties', value: 'Warranties', icon: 'Award', color: '#DC2626' },
  { label: 'Maintenance', value: 'Maintenance', icon: 'Wrench', color: '#D97706' },
  { label: 'Utilities', value: 'Utilities', icon: 'Zap', color: '#7C3AED' },
  { label: 'Permits', value: 'Permits', icon: 'FileCheck', color: '#0891B2' },
  { label: 'Inspections', value: 'Inspections', icon: 'Search', color: '#BE185D' },
  { label: 'Financial', value: 'Financial', icon: 'DollarSign', color: '#059669' },
  { label: 'Legal', value: 'Legal', icon: 'Scale', color: '#374151' },
  { label: 'Other', value: 'Other', icon: 'Folder', color: '#6B7280' },
];

const documentTypes = ['PDF', 'Image', 'Word Document', 'Excel', 'Text', 'Other'];

export default function AddDocumentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addDocument } = useVault();
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Other' as DocumentCategory,
    type: 'PDF',
    description: '',
    tags: '',
    imageUrl: '',
    fileUrl: '',
    isImportant: false,
    expirationDate: '',
    reminderDate: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a document title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await addDocument({
        title: formData.title.trim(),
        category: formData.category,
        type: formData.type,
        description: formData.description.trim() || undefined,
        tags: tagsArray,
        imageUrl: formData.imageUrl.trim() || undefined,
        fileUrl: formData.fileUrl.trim() || undefined,
        isImportant: formData.isImportant,
        expirationDate: formData.expirationDate || undefined,
        reminderDate: formData.reminderDate || undefined,
      });

      Alert.alert('Success', 'Document added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding document:', error);
      Alert.alert('Error', 'Failed to add document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryPicker = () => {
    if (!showCategoryPicker) return null;
    
    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
              <Icons.X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerOptions}>
            {categoryOptions.map((option) => {
              const IconComponent = (Icons as any)[option.icon] || Icons.Folder;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerOption,
                    formData.category === option.value && styles.pickerOptionSelected
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, category: option.value }));
                    setShowCategoryPicker(false);
                  }}
                >
                  <View style={[styles.pickerOptionIcon, { backgroundColor: option.color }]}>
                    <IconComponent size={20} color="white" />
                  </View>
                  <Text style={[
                    styles.pickerOptionText,
                    formData.category === option.value && styles.pickerOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {formData.category === option.value && (
                    <Icons.Check size={20} color={COLORS.teal} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderTypePicker = () => {
    if (!showTypePicker) return null;
    
    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Document Type</Text>
            <TouchableOpacity onPress={() => setShowTypePicker(false)}>
              <Icons.X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerOptions}>
            {documentTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.pickerOption,
                  formData.type === type && styles.pickerOptionSelected
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, type }));
                  setShowTypePicker(false);
                }}
              >
                <Text style={[
                  styles.pickerOptionText,
                  formData.type === type && styles.pickerOptionTextSelected
                ]}>
                  {type}
                </Text>
                {formData.type === type && (
                  <Icons.Check size={20} color={COLORS.teal} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Add Document',
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={isSubmitting || !formData.title.trim()}
              style={[
                styles.saveButton,
                (!formData.title.trim() || isSubmitting) && styles.saveButtonDisabled
              ]}
            >
              <Text style={[
                styles.saveButtonText,
                (!formData.title.trim() || isSubmitting) && styles.saveButtonTextDisabled
              ]}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Enter document title"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity 
              style={styles.selectInput}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text style={styles.selectText}>{formData.category}</Text>
              <Icons.ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Document Type</Text>
            <TouchableOpacity 
              style={styles.selectInput}
              onPress={() => setShowTypePicker(true)}
            >
              <Text style={styles.selectText}>{formData.type}</Text>
              <Icons.ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter document description"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Tags */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.textInput}
              value={formData.tags}
              onChangeText={(text) => setFormData(prev => ({ ...prev, tags: text }))}
              placeholder="Enter tags separated by commas"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.helpText}>Separate multiple tags with commas</Text>
          </View>

          {/* Image URL */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image URL (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.imageUrl}
              onChangeText={(text) => setFormData(prev => ({ ...prev, imageUrl: text }))}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor="#9CA3AF"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* File URL */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>File URL (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.fileUrl}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fileUrl: text }))}
              placeholder="https://example.com/document.pdf"
              placeholderTextColor="#9CA3AF"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Important Toggle */}
          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Icons.Star size={20} color={formData.isImportant ? '#F59E0B' : '#9CA3AF'} />
                <Text style={styles.label}>Mark as Important</Text>
              </View>
              <Switch
                value={formData.isImportant}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isImportant: value }))}
                trackColor={{ false: '#E5E7EB', true: COLORS.lightCream }}
                thumbColor={formData.isImportant ? COLORS.teal : '#9CA3AF'}
              />
            </View>
          </View>

          {/* Expiration Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expiration Date (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.expirationDate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, expirationDate: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.helpText}>Format: YYYY-MM-DD (e.g., 2024-12-31)</Text>
          </View>

          {/* Reminder Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reminder Date (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.reminderDate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, reminderDate: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.helpText}>Format: YYYY-MM-DD (e.g., 2025-03-15)</Text>
          </View>
        </View>
      </ScrollView>

      {renderCategoryPicker()}
      {renderTypePicker()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollContainer: {
    flex: 1,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.teal,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonTextDisabled: {
    color: '#E5E7EB',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 16,
    color: '#111827',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    maxHeight: '70%',
    width: '90%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  pickerOptions: {
    maxHeight: 300,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  pickerOptionSelected: {
    backgroundColor: '#F0F9FF',
  },
  pickerOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  pickerOptionTextSelected: {
    color: COLORS.teal,
    fontWeight: '600',
  },
});