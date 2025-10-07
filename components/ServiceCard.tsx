import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Service } from '@/types/service';
import * as Icons from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/colors';

interface ServiceCardProps {
  service: Service;
  onQuickAdd: () => void;
}

export default function ServiceCard({ service, onQuickAdd }: ServiceCardProps) {
  const IconComponent = Icons[service.icon as keyof typeof Icons] as React.ComponentType<any> || Icons.Home;
  
  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'one-time': return 'One Time';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'bi-annual': return 'Twice Yearly';
      case 'annual': return 'Annual';
      default: return frequency;
    }
  };

  const getSavingsPercentage = () => {
    if (service.id === '13') return 40; // Deal of the day
    if (service.popular) return Math.floor(Math.random() * 20) + 10; // 10-30% for popular
    return 0;
  };

  const originalPrice = getSavingsPercentage() > 0 
    ? Math.round(service.price / (1 - getSavingsPercentage() / 100))
    : service.price;

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/service/${service.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: service.image }} style={styles.image} />
        
        {service.popular && (
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.popularBadge}
          >
            <Icons.Star size={12} color="white" fill="white" />
            <Text style={styles.popularText}>Popular</Text>
          </LinearGradient>
        )}
        
        {getSavingsPercentage() > 0 && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>{getSavingsPercentage()}% OFF</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <IconComponent size={16} color="#1E3A8A" />
          <Text style={styles.category}>{service.category}</Text>
          {service.requiresLicense && (
            <View style={styles.licenseBadge}>
              <Icons.Shield size={10} color="#059669" />
            </View>
          )}
        </View>
        
        <Text style={styles.name} numberOfLines={2}>{service.name}</Text>
        
        <View style={styles.priceRow}>
          {getSavingsPercentage() > 0 && (
            <Text style={styles.originalPrice}>${originalPrice}</Text>
          )}
          <Text style={styles.price}>${service.price}</Text>
          <Text style={styles.frequency}>/{getFrequencyLabel(service.frequency)}</Text>
        </View>
        
        <View style={styles.features}>
          <View style={styles.feature}>
            <Icons.Clock size={12} color="#6B7280" />
            <Text style={styles.featureText}>{service.estimatedDuration}</Text>
          </View>
          <View style={styles.feature}>
            <Icons.CheckCircle size={12} color="#10B981" />
            <Text style={styles.featureText}>Guaranteed</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.addButton,
            getSavingsPercentage() > 0 && styles.addButtonDeal
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onQuickAdd();
          }}
        >
          <Icons.ShoppingCart size={16} color="white" />
          <Text style={styles.addButtonText}>
            {getSavingsPercentage() > 0 ? 'Grab Deal' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: '#F8FAFC',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.3,
  },
  savingsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.3,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  category: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
    flex: 1,
  },
  licenseBadge: {
    backgroundColor: '#ECFDF5',
    padding: 4,
    borderRadius: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  originalPrice: {
    fontSize: 15,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginRight: 8,
    fontWeight: '500',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.teal,
    letterSpacing: -0.3,
  },
  frequency: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
    fontWeight: '500',
  },
  features: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: COLORS.teal,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonDeal: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});