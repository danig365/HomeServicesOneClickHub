import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import { useProperties } from '@/hooks/properties-store';
import { useTechAppointments } from '@/hooks/tech-appointments-store';
import { useSnapshots } from '@/hooks/snapshot-store';
import { useUser } from '@/hooks/user-store';
import { COLORS } from '@/constants/colors';
import { Property } from '@/types/property';

type ViewMode = 'appointments' | 'properties';
type PropertyFilterType = 'all' | 'assigned' | 'unassigned';

export default function TechPortalScreen() {
  const insets = useSafeAreaInsets();
  const { properties } = useProperties();
  const { appointments, getUpcomingAppointments, getInProgressAppointments, createAppointment } = useTechAppointments();
  const { createSnapshot } = useSnapshots();
  const { currentUser, techs, assignTechToProperty, unassignTechFromProperty, getTechsForProperty } = useUser();
  
  const [viewMode, setViewMode] = useState<ViewMode>('appointments');
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilterType>('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showCreateAppointmentModal, setShowCreateAppointmentModal] = useState(false);
  const [selectedPropertyForAppointment, setSelectedPropertyForAppointment] = useState<Property | null>(null);
  const [appointmentType, setAppointmentType] = useState<'standard' | 'snapshot'>('standard');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [showQuickStartModal, setShowQuickStartModal] = useState(false);
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
  }, [inProgressAppointments.length, upcomingAppointments.length]);

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(query) && !p.address.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (propertyFilter === 'assigned') {
        const assignedTechs = getTechsForProperty(p.id);
        return assignedTechs.length > 0;
      } else if (propertyFilter === 'unassigned') {
        const assignedTechs = getTechsForProperty(p.id);
        return assignedTechs.length === 0;
      }

      return true;
    });
  }, [properties, searchQuery, propertyFilter, getTechsForProperty]);

  const handleAssignTech = (property: Property) => {
    setSelectedProperty(property);
    setShowAssignModal(true);
  };

  const handleTechAssignment = async (techId: string) => {
    if (!selectedProperty) return;

    const assignedTechs = getTechsForProperty(selectedProperty.id);
    const isAssigned = assignedTechs.some(t => t.id === techId);

    if (isAssigned) {
      await unassignTechFromProperty(techId, selectedProperty.id);
      Alert.alert('Success', 'Tech unassigned from property');
    } else {
      await assignTechToProperty(techId, selectedProperty.id);
      Alert.alert('Success', 'Tech assigned to property');
    }
  };

  const handleCreateAppointment = (property: Property) => {
    setSelectedPropertyForAppointment(property);
    setAppointmentType('standard');
    setAppointmentDate('');
    setShowCreateAppointmentModal(true);
  };

  const handleConfirmCreateAppointment = async () => {
    if (!selectedPropertyForAppointment || !appointmentDate) {
      Alert.alert('Error', 'Please select a date for the appointment');
      return;
    }

    const techId = isTech ? currentUser?.id : techs[0]?.id;
    if (!techId) {
      Alert.alert('Error', 'No tech available');
      return;
    }

    await createAppointment(
      selectedPropertyForAppointment.id,
      techId,
      appointmentType,
      appointmentDate
    );

    setShowCreateAppointmentModal(false);
    Alert.alert('Success', 'Appointment created successfully');
  };

  const handleQuickStartSnapshot = async (property: Property) => {
    const techId = isTech ? currentUser?.id : techs[0]?.id;
    if (!techId) {
      Alert.alert('Error', 'No tech available');
      return;
    }

    try {
      const snapshot = await createSnapshot(techId, property.id);
      
      console.log('Created standalone snapshot:', snapshot);
      
      setShowQuickStartModal(false);
      
      setTimeout(() => {
        router.push(`/snapshot-inspection/${snapshot.id}` as any);
      }, 100);
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      Alert.alert('Error', 'Failed to start snapshot inspection');
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
            <Icons.Calendar size={20} color={COLORS.gold} />
            <Text style={styles.statNumber}>{dashboardStats.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Icons.Clock size={20} color="#F59E0B" />
            <Text style={styles.statNumber}>{dashboardStats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Icons.CheckCircle size={20} color="#10B981" />
            <Text style={styles.statNumber}>{dashboardStats.completedToday}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Icons.Briefcase size={20} color="white" />
            <Text style={styles.statNumber}>{dashboardStats.totalAppointments}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'appointments' && styles.toggleButtonActive]}
          onPress={() => setViewMode('appointments')}
        >
          <Icons.Calendar size={20} color={viewMode === 'appointments' ? 'white' : COLORS.teal} />
          <Text style={[styles.toggleText, viewMode === 'appointments' && styles.toggleTextActive]}>
            Appointments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'properties' && styles.toggleButtonActive]}
          onPress={() => setViewMode('properties')}
        >
          <Icons.Home size={20} color={viewMode === 'properties' ? 'white' : COLORS.teal} />
          <Text style={[styles.toggleText, viewMode === 'properties' && styles.toggleTextActive]}>
            Properties
          </Text>
        </TouchableOpacity>
      </View>

      {(isTech || isAdmin) && (
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickStartButton}
            onPress={() => setShowQuickStartModal(true)}
          >
            <Icons.Zap size={24} color="white" />
            <Text style={styles.quickStartText}>QuickStart Snapshot</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.propertiesViewButton}
            onPress={() => router.push('/tech-properties-view' as any)}
          >
            <Icons.Building2 size={24} color={COLORS.teal} />
            <Text style={styles.propertiesViewText}>Properties View</Text>
          </TouchableOpacity>
        </View>
      )}

      {viewMode === 'appointments' ? (
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
      ) : (
        <>
          <View style={styles.searchContainer}>
            <Icons.Search size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search properties..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Icons.X size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {isAdmin && (
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterButton, propertyFilter === 'all' && styles.filterButtonActive]}
                onPress={() => setPropertyFilter('all')}
              >
                <Text style={[styles.filterText, propertyFilter === 'all' && styles.filterTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, propertyFilter === 'assigned' && styles.filterButtonActive]}
                onPress={() => setPropertyFilter('assigned')}
              >
                <Text style={[styles.filterText, propertyFilter === 'assigned' && styles.filterTextActive]}>
                  Assigned
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, propertyFilter === 'unassigned' && styles.filterButtonActive]}
                onPress={() => setPropertyFilter('unassigned')}
              >
                <Text style={[styles.filterText, propertyFilter === 'unassigned' && styles.filterTextActive]}>
                  Unassigned
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.scrollView}>
            <View style={styles.section}>
              {filteredProperties.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icons.Home size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No properties found</Text>
                </View>
              ) : (
                filteredProperties.map((property) => {
                  const assignedTechs = getTechsForProperty(property.id);

                  return (
                    <View key={property.id} style={styles.propertyCard}>
                      <View style={styles.propertyHeader}>
                        <View style={styles.propertyInfo}>
                          <Text style={styles.propertyName}>{property.name}</Text>
                          <Text style={styles.propertyAddress}>{property.address}</Text>
                        </View>
                      </View>

                      {assignedTechs.length > 0 && (
                        <View style={styles.techsContainer}>
                          <Text style={styles.techsLabel}>Assigned Techs:</Text>
                          {assignedTechs.map(tech => (
                            <View key={tech.id} style={styles.techBadge}>
                              <Icons.User size={14} color={COLORS.teal} />
                              <Text style={styles.techName}>{tech.name}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={styles.propertyActions}>
                        {isAdmin && (
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleAssignTech(property)}
                          >
                            <Icons.UserPlus size={18} color={COLORS.teal} />
                            <Text style={styles.actionButtonText}>Assign Tech</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.actionButton, styles.actionButtonPrimary]}
                          onPress={() => handleCreateAppointment(property)}
                        >
                          <Icons.Plus size={18} color="white" />
                          <Text style={styles.actionButtonTextPrimary}>New Appointment</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </>
      )}

      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Technicians</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <Icons.X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedProperty && (
                <>
                  <Text style={styles.modalPropertyName}>{selectedProperty.name}</Text>
                  <Text style={styles.modalPropertyAddress}>{selectedProperty.address}</Text>

                  <View style={styles.techsList}>
                    {techs.map(tech => {
                      const isAssigned = getTechsForProperty(selectedProperty.id).some(t => t.id === tech.id);

                      return (
                        <TouchableOpacity
                          key={tech.id}
                          style={[styles.techItem, isAssigned && styles.techItemAssigned]}
                          onPress={() => handleTechAssignment(tech.id)}
                        >
                          <View style={styles.techItemInfo}>
                            <Icons.User size={20} color={isAssigned ? COLORS.teal : '#6B7280'} />
                            <View style={styles.techItemDetails}>
                              <Text style={[styles.techItemName, isAssigned && styles.techItemNameAssigned]}>
                                {tech.name}
                              </Text>
                              <Text style={styles.techItemEmail}>{tech.email}</Text>
                            </View>
                          </View>
                          {isAssigned && <Icons.Check size={20} color={COLORS.teal} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCreateAppointmentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateAppointmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Appointment</Text>
              <TouchableOpacity onPress={() => setShowCreateAppointmentModal(false)}>
                <Icons.X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedPropertyForAppointment && (
                <>
                  <Text style={styles.modalPropertyName}>{selectedPropertyForAppointment.name}</Text>
                  <Text style={styles.modalPropertyAddress}>{selectedPropertyForAppointment.address}</Text>

                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Appointment Type</Text>
                    <View style={styles.typeSelector}>
                      <TouchableOpacity
                        style={[styles.typeOption, appointmentType === 'standard' && styles.typeOptionActive]}
                        onPress={() => setAppointmentType('standard')}
                      >
                        <Icons.CheckSquare size={20} color={appointmentType === 'standard' ? 'white' : COLORS.teal} />
                        <Text style={[styles.typeOptionText, appointmentType === 'standard' && styles.typeOptionTextActive]}>
                          Standard Home Care
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.typeOption, appointmentType === 'snapshot' && styles.typeOptionActive]}
                        onPress={() => setAppointmentType('snapshot')}
                      >
                        <Icons.Camera size={20} color={appointmentType === 'snapshot' ? 'white' : COLORS.teal} />
                        <Text style={[styles.typeOptionText, appointmentType === 'snapshot' && styles.typeOptionTextActive]}>
                          MyHome Snapshot
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Scheduled Date</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9CA3AF"
                      value={appointmentDate}
                      onChangeText={setAppointmentDate}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleConfirmCreateAppointment}
                  >
                    <Icons.Plus size={20} color="white" />
                    <Text style={styles.createButtonText}>Create Appointment</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showQuickStartModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuickStartModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.quickStartModalHeader}>
                <Icons.Zap size={24} color="#F59E0B" />
                <Text style={styles.modalTitle}>QuickStart Snapshot</Text>
              </View>
              <TouchableOpacity onPress={() => setShowQuickStartModal(false)}>
                <Icons.X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.quickStartDescription}>
                Start a MyHome Snapshot inspection immediately. Select a property to begin the comprehensive home inspection.
              </Text>

              <View style={styles.propertiesList}>
                {properties.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Icons.Home size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No properties available</Text>
                  </View>
                ) : (
                  properties.map((property) => (
                    <TouchableOpacity
                      key={property.id}
                      style={styles.quickStartPropertyCard}
                      onPress={() => handleQuickStartSnapshot(property)}
                    >
                      <View style={styles.quickStartPropertyInfo}>
                        <Icons.Home size={20} color={COLORS.teal} />
                        <View style={styles.quickStartPropertyDetails}>
                          <Text style={styles.quickStartPropertyName}>{property.name}</Text>
                          <Text style={styles.quickStartPropertyAddress}>{property.address}</Text>
                        </View>
                      </View>
                      <Icons.ChevronRight size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  quickStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quickStartText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'white',
  },
  propertiesViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.teal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertiesViewText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.teal,
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
