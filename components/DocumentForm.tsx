import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Icons from 'lucide-react-native';
import { Document, DocumentCategory } from '@/types/document';
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

interface FormData {
  title: string;
  category: DocumentCategory;
  type: string;
  description: string;
  tags: string[];
  image_url?: string;
  file_url?: string;
  fileName?: string;
  is_important: boolean;
  expiration_date?: string;
  reminder_date?: string;
  property_id?: string;
}

interface DocumentFormProps {
  initialData?: Document;
  onSubmit: (data: FormData) => Promise<void>;
  mode?: 'add' | 'edit';
}

export default function DocumentForm({ initialData, onSubmit, mode = 'add' }: DocumentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  
  const [formData, setFormData] = useState<FormData>(() => ({
    title: initialData?.title || '',
    category: initialData?.category || 'Other',
    type: initialData?.type || 'PDF',
    description: initialData?.description || '',
    tags: initialData?.tags || [],
    image_url: initialData?.image_url,
    file_url: initialData?.file_url,
    is_important: initialData?.is_important || false,
    expiration_date: initialData?.expiration_date,
    reminder_date: initialData?.reminder_date,
    property_id: initialData?.property_id,
  }));

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('[DocumentForm] File picked:', file);
        
        setFormData(prev => ({
          ...prev,
          file_url: file.uri,
          file_name: file.name,
          file_type: file.mimeType,
          file_size: file.size,
        }));
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({
          ...prev,
          image_url: result.assets[0].uri,
        }));
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a document title');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      router.back();
    } catch (error) {
      console.error('Error saving document:', error);
      Alert.alert('Error', 'Failed to save document');
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
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContent}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Enter document title"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Category Selector */}
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

          {/* Type Selector */}
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
              style={[styles.input, styles.textArea]}
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
              style={styles.input}
              value={formData.tags.join(', ')}
              onChangeText={(text) => {
                const tagsArray = text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                setFormData(prev => ({ ...prev, tags: tagsArray }));
              }}
              placeholder="Enter tags separated by commas"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.helpText}>Separate multiple tags with commas</Text>
          </View>

          {/* Document File */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Document File</Text>
            <TouchableOpacity 
              style={styles.filePicker}
              onPress={pickDocument}
            >
              <Icons.Upload size={24} color={COLORS.teal} />
              <Text style={styles.filePickerText}>
                {formData.fileName || (formData.file_url ? 'File selected' : 'Select a document file')}
              </Text>
            </TouchableOpacity>
            {formData.file_url && !formData.fileName && (
              <Text style={styles.helpText}>File URL: {formData.file_url}</Text>
            )}
          </View>

          {/* Document Image */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Document Image (Optional)</Text>
            <TouchableOpacity 
              style={styles.filePicker}
              onPress={pickImage}
            >
              <Icons.Image size={24} color={COLORS.teal} />
              <Text style={styles.filePickerText}>
                {formData.image_url ? 'Change image' : 'Select an image'}
              </Text>
            </TouchableOpacity>
            {formData.image_url && (
              <Image 
                source={{ uri: formData.image_url }} 
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}
          </View>

          {/* Important Switch */}
          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Icons.Star size={20} color={formData.is_important ? '#F59E0B' : '#9CA3AF'} />
                <Text style={styles.label}>Mark as Important</Text>
              </View>
              <Switch
                value={formData.is_important}
                onValueChange={(value) => setFormData(prev => ({ ...prev, is_important: value }))}
                trackColor={{ false: '#E5E7EB', true: COLORS.lightCream }}
                thumbColor={formData.is_important ? COLORS.teal : '#9CA3AF'}
              />
            </View>
          </View>

          {/* Expiration Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expiration Date (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.expiration_date}
              onChangeText={(text) => setFormData(prev => ({ ...prev, expiration_date: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.helpText}>Format: YYYY-MM-DD (e.g., 2024-12-31)</Text>
          </View>

          {/* Reminder Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reminder Date (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.reminder_date}
              onChangeText={(text) => setFormData(prev => ({ ...prev, reminder_date: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.helpText}>Format: YYYY-MM-DD (e.g., 2025-03-15)</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[
              styles.saveButton,
              (isSubmitting || !formData.title.trim()) && styles.saveButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !formData.title.trim()}
          >
            <Text style={styles.saveButtonText}>
              {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Document' : 'Save Document'}
            </Text>
          </TouchableOpacity>
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
  formContent: {
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
  input: {
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
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filePickerText: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 8,
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
  saveButton: {
    backgroundColor: COLORS.teal,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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