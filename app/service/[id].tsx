import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { services } from '@/constants/services';
import { Clock, Check, Shield, Calendar } from 'lucide-react-native';
import { useCart } from '@/hooks/cart-store';
import { useProperties } from '@/hooks/properties-store';
import PropertySelector from '@/components/PropertySelector';
import { COLORS } from '@/constants/colors';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const service = services.find(s => s.id === id);
  const { addToCart } = useCart();
  const { getSelectedProperty } = useProperties();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const property = getSelectedProperty();

  if (!service) {
    return (
      <View style={styles.container}>
        <Text>Service not found</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    addToCart(service, selectedDate);
    Alert.alert(
      'Added to Cart',
      `${service.name} has been added to your cart.`,
      [
        { text: 'Continue Shopping', onPress: () => router.back() },
        { text: 'View Cart', onPress: () => router.push('/cart') }
      ]
    );
  };

  const handleBookNow = () => {
    addToCart(service, selectedDate);
    router.push('/checkout');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image source={{ uri: service.image }} style={styles.heroImage} />
      
      <View style={styles.content}>
        <View style={styles.propertySection}>
          <Text style={styles.propertySectionTitle}>Select Property</Text>
          <PropertySelector />
        </View>
        <View style={styles.header}>
          <View>
            <Text style={styles.category}>{service.category}</Text>
            <Text style={styles.name}>{service.name}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${service.price}</Text>
            <Text style={styles.frequency}>/{service.frequency}</Text>
          </View>
        </View>

        <Text style={styles.description}>{service.description}</Text>

        <View style={styles.infoRow}>
          <Clock size={20} color="#6B7280" />
          <Text style={styles.infoText}>Duration: {service.estimatedDuration}</Text>
        </View>

        {service.requiresLicense && (
          <View style={styles.infoRow}>
            <Shield size={20} color="#10B981" />
            <Text style={styles.infoText}>Licensed & Insured Professionals</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          {service.included.map((item, index) => (
            <View key={index} style={styles.includedItem}>
              <Check size={16} color="#10B981" />
              <Text style={styles.includedText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule Service</Text>
          <TouchableOpacity style={styles.dateSelector}>
            <Calendar size={20} color="#6B7280" />
            <Text style={styles.dateSelectorText}>
              {selectedDate || 'Select preferred date'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.bookNowButton} onPress={handleBookNow}>
            <Text style={styles.bookNowText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  heroImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 20,
  },
  propertySection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  propertySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  category: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    maxWidth: 200,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.teal,
  },
  frequency: {
    fontSize: 14,
    color: '#6B7280',
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginTop: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  includedText: {
    fontSize: 14,
    color: '#374151',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateSelectorText: {
    fontSize: 16,
    color: '#374151',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  addToCartButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.teal,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.teal,
  },
  bookNowButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.accent.success,
    alignItems: 'center',
  },
  bookNowText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});