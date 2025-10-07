import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, TextInput, Modal, SafeAreaView } from 'react-native';
import { Home, MapPin, Plus, Edit2, Trash2, Star, X, Bell } from 'lucide-react-native';
import { useProperties } from '@/hooks/properties-store';
import { Property } from '@/types/property';
import { Stack, router } from 'expo-router';
import { COLORS } from '@/constants/colors';

export default function PropertiesScreen() {
  const { properties, addProperty, updateProperty, deleteProperty, selectProperty, selectedPropertyId, getUpcomingReminders, getOverdueReminders } = useProperties();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    type: 'primary' as Property['type'],
    isPrimary: false,
  });

  const handleAddProperty = () => {
    setEditingProperty(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      type: 'primary',
      isPrimary: false,
    });
    setModalVisible(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      type: property.type,
      isPrimary: property.isPrimary,
    });
    setModalVisible(true);
  };

  const handleSaveProperty = async () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (editingProperty) {
        await updateProperty(editingProperty.id, formData);
        Alert.alert('Success', 'Property updated successfully');
      } else {
        await addProperty(formData);
        Alert.alert('Success', 'Property added successfully');
      }
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to save property');
    }
  };

  const handleDeleteProperty = (property: Property) => {
    Alert.alert(
      'Delete Property',
      `Are you sure you want to delete ${property.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProperty(property.id);
            Alert.alert('Success', 'Property deleted successfully');
          },
        },
      ]
    );
  };

  const handleSelectProperty = async (propertyId: string) => {
    await selectProperty(propertyId);
  };

  const getPropertyTypeLabel = (type: Property['type']) => {
    const labels = {
      primary: 'Primary',
      secondary: 'Secondary',
      rental: 'Rental',
      vacation: 'Vacation',
    };
    return labels[type];
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'My Properties',
          headerStyle: { backgroundColor: COLORS.teal },
          headerTintColor: 'white',
        }} 
      />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Manage Your Properties</Text>
            <Text style={styles.headerSubtitle}>
              Add and manage all your properties in one place
            </Text>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddProperty}>
            <Plus size={24} color="white" />
            <Text style={styles.addButtonText}>Add New Property</Text>
          </TouchableOpacity>

          <View style={styles.propertiesList}>
            {properties.map((property) => (
              <View key={property.id} style={styles.propertyCard}>
                {property.imageUrl ? (
                  <Image source={{ uri: property.imageUrl }} style={styles.propertyImage} />
                ) : (
                  <View style={styles.propertyImagePlaceholder}>
                    <Home size={40} color="#9CA3AF" />
                  </View>
                )}

                <View style={styles.propertyContent}>
                  <View style={styles.propertyHeader}>
                    <View style={styles.propertyTitleRow}>
                      <Text style={styles.propertyName}>{property.name}</Text>
                      {property.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Star size={12} color="white" fill="white" />
                          <Text style={styles.primaryBadgeText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{getPropertyTypeLabel(property.type)}</Text>
                    </View>
                  </View>

                  <View style={styles.addressContainer}>
                    <MapPin size={16} color="#6B7280" />
                    <Text style={styles.address}>
                      {property.address}, {property.city}, {property.state} {property.zipCode}
                    </Text>
                  </View>

                  {property.squareFeet && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailText}>{property.squareFeet} sq ft</Text>
                      {property.bedrooms && (
                        <Text style={styles.detailText}>{property.bedrooms} bed</Text>
                      )}
                      {property.bathrooms && (
                        <Text style={styles.detailText}>{property.bathrooms} bath</Text>
                      )}
                    </View>
                  )}

                  {property.reminders && property.reminders.length > 0 && (
                    <View style={styles.remindersRow}>
                      <Bell size={14} color={COLORS.teal} />
                      <Text style={styles.remindersText}>
                        {getUpcomingReminders(property.id).length} upcoming, {getOverdueReminders(property.id).length} overdue
                      </Text>
                    </View>
                  )}

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.selectButton,
                        selectedPropertyId === property.id && styles.selectButtonActive
                      ]}
                      onPress={() => handleSelectProperty(property.id)}
                    >
                      <Text
                        style={[
                          styles.selectButtonText,
                          selectedPropertyId === property.id && styles.selectButtonTextActive
                        ]}
                      >
                        {selectedPropertyId === property.id ? 'Selected' : 'Select'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => {
                        selectProperty(property.id);
                        router.push('/property-reminders');
                      }}
                    >
                      <Bell size={18} color={COLORS.teal} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleEditProperty(property)}
                    >
                      <Edit2 size={18} color="#6B7280" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDeleteProperty(property)}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingProperty ? 'Edit Property' : 'Add Property'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Property Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="e.g., Main Residence"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Address *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                    placeholder="Street address"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 2 }]}>
                    <Text style={styles.label}>City *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.city}
                      onChangeText={(text) => setFormData({ ...formData, city: text })}
                      placeholder="City"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>State *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.state}
                      onChangeText={(text) => setFormData({ ...formData, state: text })}
                      placeholder="CA"
                      placeholderTextColor="#9CA3AF"
                      maxLength={2}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>ZIP Code *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.zipCode}
                    onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
                    placeholder="90210"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Property Type</Text>
                  <View style={styles.typeButtons}>
                    {(['primary', 'secondary', 'rental', 'vacation'] as const).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          formData.type === type && styles.typeButtonActive
                        ]}
                        onPress={() => setFormData({ ...formData, type })}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            formData.type === type && styles.typeButtonTextActive
                          ]}
                        >
                          {getPropertyTypeLabel(type)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setFormData({ ...formData, isPrimary: !formData.isPrimary })}
                >
                  <View style={[styles.checkbox, formData.isPrimary && styles.checkboxChecked]}>
                    {formData.isPrimary && <Star size={14} color="white" fill="white" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Set as primary property</Text>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProperty}>
                  <Text style={styles.saveButtonText}>
                    {editingProperty ? 'Update' : 'Add'} Property
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.teal,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  propertiesList: {
    padding: 20,
    gap: 16,
  },
  propertyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 180,
  },
  propertyImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyContent: {
    padding: 16,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  propertyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
  },
  typeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonActive: {
    backgroundColor: COLORS.accent.success,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectButtonTextActive: {
    color: 'white',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remindersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  remindersText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.teal,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeButtonActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
