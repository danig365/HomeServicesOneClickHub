import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useBookings } from '@/hooks/bookings-store';
import { Calendar, Clock, MapPin, User, X, Repeat, Pause, Play, XCircle } from 'lucide-react-native';
import { Booking, RecurringService } from '@/types/service';
import { COLORS } from '@/constants/colors';

export default function BookingsScreen() {
  const { 
    getUpcomingBookings, 
    getPastBookings, 
    cancelBooking,
    getActiveRecurringServices,
    getPausedRecurringServices,
    pauseRecurringService,
    resumeRecurringService,
    cancelRecurringService
  } = useBookings();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'recurring'>('upcoming');
  
  const upcomingBookings = getUpcomingBookings();
  const pastBookings = getPastBookings();
  const activeRecurring = getActiveRecurringServices();
  const pausedRecurring = getPausedRecurringServices();
  const allRecurring = [...activeRecurring, ...pausedRecurring];
  
  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : 
                         activeTab === 'past' ? pastBookings : [];

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel ${booking.serviceName}?`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            cancelBooking(booking.id);
            Alert.alert('Booking Cancelled', 'Your booking has been cancelled.');
          }
        }
      ]
    );
  };

  const handlePauseRecurring = (service: RecurringService) => {
    Alert.alert(
      'Pause Service',
      `Pause ${service.serviceName}? You can resume it anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pause', 
          onPress: () => {
            pauseRecurringService(service.id);
            Alert.alert('Service Paused', 'Your recurring service has been paused.');
          }
        }
      ]
    );
  };

  const handleResumeRecurring = (service: RecurringService) => {
    resumeRecurringService(service.id);
    Alert.alert('Service Resumed', 'Your recurring service is now active.');
  };

  const handleCancelRecurring = (service: RecurringService) => {
    Alert.alert(
      'Cancel Recurring Service',
      `Are you sure you want to cancel ${service.serviceName}? This cannot be undone.`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            cancelRecurringService(service.id);
            Alert.alert('Service Cancelled', 'Your recurring service has been cancelled.');
          }
        }
      ]
    );
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      monthly: 'Monthly',
      quarterly: 'Every 3 Months',
      'bi-annual': 'Every 6 Months',
      annual: 'Annually'
    };
    return labels[frequency] || frequency;
  };

  const renderRecurringService = (service: RecurringService) => (
    <View key={service.id} style={styles.recurringCard}>
      <View style={styles.recurringHeader}>
        <View style={styles.recurringTitleRow}>
          <Repeat size={20} color="#1E3A8A" />
          <Text style={styles.recurringName}>{service.serviceName}</Text>
        </View>
        <View style={[styles.recurringStatusBadge, service.status === 'active' ? styles.statusActive : styles.statusPaused]}>
          <Text style={styles.recurringStatusText}>{service.status}</Text>
        </View>
      </View>
      
      <View style={styles.recurringDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.detailText}>Next service: {service.nextServiceDate}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.detailText}>{getFrequencyLabel(service.frequency)}</Text>
        </View>
      </View>
      
      <View style={styles.recurringFooter}>
        <Text style={styles.recurringPrice}>${service.price}/{service.frequency === 'monthly' ? 'mo' : 'service'}</Text>
        <View style={styles.recurringActions}>
          {service.status === 'active' ? (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handlePauseRecurring(service)}
            >
              <Pause size={18} color="#F59E0B" />
              <Text style={styles.actionButtonText}>Pause</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleResumeRecurring(service)}
            >
              <Play size={18} color="#10B981" />
              <Text style={styles.actionButtonText}>Resume</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelRecurring(service)}
          >
            <XCircle size={18} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderBooking = (booking: Booking) => (
    <View key={booking.id} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.serviceName}>{booking.serviceName}</Text>
        {booking.status === 'upcoming' && (
          <TouchableOpacity onPress={() => handleCancelBooking(booking)}>
            <X size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.detailText}>{booking.date}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.detailText}>{booking.time}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.detailText}>{booking.address}</Text>
        </View>
        
        {booking.providerName && (
          <View style={styles.detailRow}>
            <User size={16} color="#6B7280" />
            <Text style={styles.detailText}>{booking.providerName}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.bookingFooter}>
        <Text style={styles.price}>${booking.price}</Text>
        <View style={[styles.statusBadge, styles[`status${booking.status}`]]}>
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming ({upcomingBookings.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'recurring' && styles.activeTab]}
          onPress={() => setActiveTab('recurring')}
        >
          <Text style={[styles.tabText, activeTab === 'recurring' && styles.activeTabText]}>
            Recurring ({allRecurring.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Past ({pastBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'recurring' ? (
          allRecurring.length === 0 ? (
            <View style={styles.emptyState}>
              <Repeat size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No recurring services</Text>
              <Text style={styles.emptyText}>
                Set up recurring services for hassle-free home maintenance
              </Text>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {allRecurring.map(renderRecurringService)}
            </View>
          )
        ) : (
          displayBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'upcoming' 
                  ? 'Book a service to see it here'
                  : 'Your completed bookings will appear here'}
              </Text>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {displayBookings.map(renderBooking)}
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.card,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.teal,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.teal,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  bookingsList: {
    padding: 16,
    gap: 12,
  },
  bookingCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.secondary,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.teal,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusupcoming: {
    backgroundColor: '#DBEAFE',
  },
  statuscompleted: {
    backgroundColor: '#D1FAE5',
  },
  statuscancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: COLORS.text.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  recurringCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.teal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recurringTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  recurringName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
  },
  recurringStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusPaused: {
    backgroundColor: '#FEF3C7',
  },
  recurringStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: COLORS.text.primary,
  },
  recurringDetails: {
    gap: 8,
    marginBottom: 12,
  },
  recurringFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.secondary,
  },
  recurringPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.teal,
  },
  recurringActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.background.secondary,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
  },
  cancelButtonText: {
    color: COLORS.accent.error,
  },
});