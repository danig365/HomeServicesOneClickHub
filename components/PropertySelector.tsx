import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { ChevronDown, Home, MapPin, Check } from 'lucide-react-native';
import { useProperties } from '@/hooks/properties-store';
import { Property } from '@/types/property';
import { COLORS } from '@/constants/colors';

interface PropertySelectorProps {
  onPropertyChange?: (property: Property) => void;
  style?: any;
}

export default function PropertySelector({ onPropertyChange, style }: PropertySelectorProps) {
  const { properties, selectedPropertyId, selectProperty, getSelectedProperty } = useProperties();
  const [modalVisible, setModalVisible] = useState(false);
  const selectedProperty = getSelectedProperty();

  const handleSelectProperty = async (propertyId: string) => {
    await selectProperty(propertyId);
    const property = properties.find(p => p.id === propertyId);
    if (property && onPropertyChange) {
      onPropertyChange(property);
    }
    setModalVisible(false);
  };

  if (!selectedProperty) return null;

  return (
    <>
      <TouchableOpacity 
        style={[styles.container, style]} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Home size={20} color={COLORS.gold} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Property</Text>
          <Text style={styles.propertyName} numberOfLines={1}>{selectedProperty.name}</Text>
        </View>
        <ChevronDown size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Property</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.propertiesList} showsVerticalScrollIndicator={false}>
              {properties.map((property) => (
                <TouchableOpacity
                  key={property.id}
                  style={[
                    styles.propertyItem,
                    selectedPropertyId === property.id && styles.propertyItemSelected
                  ]}
                  onPress={() => handleSelectProperty(property.id)}
                >
                  {property.imageUrl ? (
                    <Image source={{ uri: property.imageUrl }} style={styles.propertyImage} />
                  ) : (
                    <View style={styles.propertyImagePlaceholder}>
                      <Home size={24} color="#9CA3AF" />
                    </View>
                  )}
                  
                  <View style={styles.propertyInfo}>
                    <View style={styles.propertyNameRow}>
                      <Text style={styles.propertyItemName}>{property.name}</Text>
                      {property.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.addressRow}>
                      <MapPin size={14} color="#6B7280" />
                      <Text style={styles.propertyAddress} numberOfLines={1}>
                        {property.address}, {property.city}
                      </Text>
                    </View>
                  </View>

                  {selectedPropertyId === property.id && (
                    <View style={styles.checkContainer}>
                      <Check size={20} color="#10B981" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gold + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  propertyName: {
    fontSize: 15,
    color: 'white',
    fontWeight: '600',
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
    maxHeight: '80%',
    paddingBottom: 40,
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
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.teal,
  },
  propertiesList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  propertyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  propertyItemSelected: {
    backgroundColor: COLORS.lightCream,
    borderColor: COLORS.accent.success,
  },
  propertyImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  propertyImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  propertyItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  primaryBadge: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyAddress: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  checkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
