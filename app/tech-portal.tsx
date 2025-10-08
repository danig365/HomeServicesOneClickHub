import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import { useProperties } from '@/hooks/properties-store';
import { useTechAppointments } from '@/hooks/tech-appointments-store';
import { useSnapshots } from '@/hooks/snapshot-store';
import { useUser } from '@/hooks/user-store';
import { COLORS } from '@/constants/colors';
import { Property } from '@/types/property';

export default function TechPortalScreen() {
  const insets = useSafeAreaInsets();
  const { properties } = useProperties();
  const { appointments, getUpcomingAppointments, getInProgressAppointments } = useTechAppointments();
  const { } = useSnapshots();
  const { currentUser } = useUser();
  
  const [dashboardStats, setDashboardStats] = useState({
    totalAppointments: 0,
    completedToday: 0,
    inProgress: 0,
    upcoming: 0,
  });

  const isAdmin = currentUser?.role === 'admin';
  const isTech = currentUser?.role === 'tech';

  const upcomingAppointments = getUpcomingAppointments(isTech ? currentUser?.id : undefined);
  const inProgressAppointments = getInProgressAppointments(isTech ? currentUser?.id : undefined);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const completedToday = appointments.filter(apt => {
      if (apt.status !== 'completed' || !apt.completedAt) return false;
      const completedDate = new Date(apt.completedAt);
      return completedDate >= today && completedDate < tomorrow;
    }).length;

    setDashboardStats({
      totalAppointments: appointments.length,
      completedToday,
      inProgress: inProgressAppointments.length,
      upcoming: upcomingAppointments.length,
    });
  }, [appointments, inProgressAppointments.length, upcomingAppointments.length]);

  const handleQuickStartSnapshot = async (property: Property) => {
    const techId = isTech ? currentUser?.id : undefined;
    if (!techId) {
      Alert.alert('Error', 'No tech available');
      return;
    }

    try {
      router.push(`/quickstart-snapshot?propertyId=${property.id}` as any);
    } catch (error) {
      console.error('Failed to start QuickStart:', error);
      Alert.alert('Error', 'Failed to start QuickStart snapshot');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ 
        title: 'Tech Portal', 
        headerStyle: { backgroundColor: COLORS.teal }, 
        headerTintColor: COLORS.gold 
      }} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerIconContainer}>
            <Icons.Wrench size={28} color="white" />
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Hudson Tech Portal</Text>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {isAdmin ? 'Admin' : isTech ? 'Technician' : 'View Only'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icons.Calendar size={18} color={COLORS.gold} />
            <Text style={styles.statNumber}>{dashboardStats.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Icons.Clock size={18} color="#F59E0B" />
            <Text style={styles.statNumber}>{dashboardStats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Icons.CheckCircle size={18} color="#10B981" />
            <Text style={styles.statNumber}>{dashboardStats.completedToday}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Icons.Home size={18} color="white" />
            <Text style={styles.statNumber}>{properties.length}</Text>
            <Text style={styles.statLabel}>Properties</Text>
          </View>
        </View>
      </View>

      {(isTech || isAdmin) && (
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/tech-properties-view' as any)}
            >
              <View style={styles.quickActionIconContainer}>
                <Icons.Building2 size={28} color={COLORS.teal} />
              </View>
              <Text style={styles.quickActionTitle}>Properties</Text>
              <Text style={styles.quickActionSubtitle}>View all properties</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, styles.quickActionCardHighlight]}
              onPress={() => {
                if (properties.length === 1) {
                  handleQuickStartSnapshot(properties[0]);
                } else {
                  router.push('/tech-properties-view' as any);
                }
              }}
            >
              <View style={[styles.quickActionIconContainer, styles.quickActionIconHighlight]}>
                <Icons.Zap size={28} color="white" />
              </View>
              <Text style={[styles.quickActionTitle, styles.quickActionTitleHighlight]}>QuickStart</Text>
              <Text style={[styles.quickActionSubtitle, styles.quickActionSubtitleHighlight]}>Room-by-room photos</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In Progress</Text>
          {inProgressAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Icons.Clock size={40} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyText}>No appointments in progress</Text>
              <Text style={styles.emptySubtext}>Start working on scheduled appointments</Text>
            </View>
          ) : (
            inProgressAppointments.map((apt) => {
              const property = properties.find(p => p.id === apt.propertyId);
              if (!property) return null;

              return (
                <TouchableOpacity
                  key={apt.id}
                  style={styles.appointmentCard}
                  onPress={() => router.push(`/appointment/${apt.id}` as any)}
                >
                  <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentIconBadge}>
                      {apt.type === 'snapshot' ? (
                        <Icons.Camera size={20} color="#F59E0B" />
                      ) : (
                        <Icons.Wrench size={20} color={COLORS.teal} />
                      )}
                    </View>
                    <View style={styles.appointmentInfo}>
                      <Text style={styles.appointmentProperty}>{property.name}</Text>
                      <Text style={styles.appointmentAddress}>{property.address}</Text>
                      <View style={styles.appointmentMetaRow}>
                        <Icons.Calendar size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{formatDate(apt.scheduledDate)}</Text>
                        <View style={styles.statusBadge}>
                          <View style={styles.statusDot} />
                          <Text style={styles.statusText}>In Progress</Text>
                        </View>
                      </View>
                    </View>
                    <Icons.ChevronRight size={20} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          {upcomingAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Icons.Calendar size={40} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyText}>No upcoming appointments</Text>
              <Text style={styles.emptySubtext}>Schedule new appointments from properties</Text>
            </View>
          ) : (
            upcomingAppointments.map((apt) => {
              const property = properties.find(p => p.id === apt.propertyId);
              if (!property) return null;

              return (
                <TouchableOpacity
                  key={apt.id}
                  style={styles.appointmentCard}
                  onPress={() => router.push(`/appointment/${apt.id}` as any)}
                >
                  <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentIconBadge}>
                      {apt.type === 'snapshot' ? (
                        <Icons.Camera size={20} color="#F59E0B" />
                      ) : (
                        <Icons.Wrench size={20} color={COLORS.teal} />
                      )}
                    </View>
                    <View style={styles.appointmentInfo}>
                      <Text style={styles.appointmentProperty}>{property.name}</Text>
                      <Text style={styles.appointmentAddress}>{property.address}</Text>
                      <View style={styles.appointmentMetaRow}>
                        <Icons.Calendar size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{formatDate(apt.scheduledDate)}</Text>
                      </View>
                    </View>
                    <Icons.ChevronRight size={20} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>


    </View>
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
    backgroundColor: COLORS.teal,
    padding: 24,
    gap: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitleContainer: {
    flex: 1,
    gap: 8,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: 'white',
    letterSpacing: 0.5,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: 'white',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.teal,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: COLORS.teal,
  },
  toggleTextActive: {
    color: 'white',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    gap: 12,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#111827',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appointmentIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentProperty: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 2,
  },
  appointmentAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  appointmentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.teal,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.teal,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.teal,
  },
  filterTextActive: {
    color: 'white',
  },
  propertyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  propertyHeader: {
    marginBottom: 12,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  techsContainer: {
    marginBottom: 12,
  },
  techsLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 8,
  },
  techBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  techName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: COLORS.teal,
  },
  propertyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.teal,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.teal,
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  modalScroll: {
    padding: 20,
  },
  modalPropertyName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  modalPropertyAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  techsList: {
    gap: 12,
  },
  techItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  techItemAssigned: {
    borderColor: COLORS.teal,
    backgroundColor: '#F0FDFA',
  },
  techItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  techItemDetails: {
    flex: 1,
  },
  techItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  techItemNameAssigned: {
    color: COLORS.teal,
  },
  techItemEmail: {
    fontSize: 13,
    color: '#6B7280',
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
  },
  typeSelector: {
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.teal,
  },
  typeOptionActive: {
    backgroundColor: COLORS.teal,
  },
  typeOptionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: COLORS.teal,
  },
  typeOptionTextActive: {
    color: 'white',
  },
  dateInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.teal,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'white',
  },
  quickActionsContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionCardHighlight: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconHighlight: {
    backgroundColor: '#F59E0B',
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#111827',
  },
  quickActionTitleHighlight: {
    color: '#92400E',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  quickActionSubtitleHighlight: {
    color: '#92400E',
  },
  quickStartModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickStartDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 20,
  },
  propertiesList: {
    gap: 12,
  },
  quickStartPropertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickStartPropertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  quickStartPropertyDetails: {
    flex: 1,
  },
  quickStartPropertyName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 2,
  },
  quickStartPropertyAddress: {
    fontSize: 13,
    color: '#6B7280',
  },
});
