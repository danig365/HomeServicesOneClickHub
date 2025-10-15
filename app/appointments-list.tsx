import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import { useAppointments } from '@/hooks/appointments-store';
import { COLORS } from '@/constants/colors';
import { Appointment } from '@/types/appointment';

type TabType = 'upcoming' | 'past';

export default function AppointmentsListScreen() {
  const insets = useSafeAreaInsets();
  const { 
    appointments, 
    isLoading, 
    loadAppointments,
    getUpcomingAppointments,
    getPastAppointments 
  } = useAppointments();

  // Add loading effect
  useEffect(() => {
    console.log('AppointmentsListScreen mounted');
    loadAppointments().catch(error => {
      console.error('Failed to load appointments:', error);
    });
  }, []);

  // Add debug logging
  useEffect(() => {
    console.log('Current appointments:', appointments.length);
    console.log('Loading state:', isLoading);
  }, [appointments, isLoading]);

  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    console.log('Refreshing appointments');
    setRefreshing(true);
    try {
      await loadAppointments();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#F0FDF4', text: '#10B981', icon: 'CheckCircle' };
      case 'cancelled':
        return { bg: '#FEF2F2', text: '#EF4444', icon: 'XCircle' };
      default:
        return { bg: '#DBEAFE', text: '#1E40AF', icon: 'Clock' };
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const statusColors = getStatusColor(appointment.status);
    const completedTasks = appointment.tasks?.filter(t => t.completed).length || 0;
    const totalTasks = appointment.tasks?.length || 0;

    return (
      <TouchableOpacity
        key={appointment.id}
        style={styles.appointmentCard}
        onPress={() => router.push(`/appointment/${appointment.id}`)}  // Restore original path
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconContainer, { backgroundColor: statusColors.bg }]}>
              {appointment.type === 'snapshot-inspection' ? (
                <Icons.Camera size={20} color={statusColors.text} />
              ) : (
                <Icons.Wrench size={20} color={statusColors.text} />
              )}
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.propertyName}>{appointment.propertyName}</Text>
              <Text style={styles.appointmentType}>
                {appointment.type === 'snapshot-inspection' ? 'Snapshot Inspection' : 'Monthly Maintenance'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {appointment.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Icons.Calendar size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {formatDate(appointment.scheduledDate)} at {formatTime(appointment.scheduledDate)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icons.User size={16} color="#6B7280" />
            <Text style={styles.infoText}>{appointment.techName}</Text>
          </View>

          {appointment.propertyAddress && (
            <View style={styles.infoRow}>
              <Icons.MapPin size={16} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={1}>
                {appointment.propertyAddress}
              </Text>
            </View>
          )}

          {totalTasks > 0 && (
            <View style={styles.taskProgress}>
              <View style={styles.taskProgressBar}>
                <View 
                  style={[
                    styles.taskProgressFill, 
                    { width: `${(completedTasks / totalTasks) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.taskProgressText}>
                {completedTasks}/{totalTasks} tasks
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Icons.ChevronRight size={16} color={COLORS.teal} />
        </View>
      </TouchableOpacity>
    );
  };

  const upcomingAppointments = getUpcomingAppointments();
  const pastAppointments = getPastAppointments();
  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{ 
          title: 'Appointments',
          headerStyle: { backgroundColor: COLORS.teal },
          headerTintColor: 'white',
        }} 
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming ({upcomingAppointments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past ({pastAppointments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.teal} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.teal}
            />
          }
        >
          {displayedAppointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icons.CalendarX size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>
                No {activeTab} appointments
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'upcoming' 
                  ? 'Your upcoming appointments will appear here'
                  : 'Your completed and past appointments will appear here'}
              </Text>
            </View>
          ) : (
            <View style={styles.appointmentsList}>
              {displayedAppointments.map(appointment => renderAppointmentCard(appointment))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 4,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.teal,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  appointmentsList: {
    padding: 16,
    gap: 16,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  taskProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  taskProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  taskProgressFill: {
    height: '100%',
    backgroundColor: COLORS.teal,
    borderRadius: 3,
  },
  taskProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.teal,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});