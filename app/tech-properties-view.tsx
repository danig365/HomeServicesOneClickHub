import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import { useProperties } from '@/hooks/properties-store';
import { useTechAppointments } from '@/hooks/tech-appointments-store';
import { useSnapshots } from '@/hooks/snapshot-store';
import { useUser } from '@/hooks/user-store';
import { useSubscription } from '@/hooks/subscription-store';
import { COLORS } from '@/constants/colors';
import { Property } from '@/types/property';
import { TechAppointment, SnapshotInspection } from '@/types/tech-appointment';

interface PropertyWithData {
  property: Property;
  appointments: TechAppointment[];
  snapshots: SnapshotInspection[];
  totalAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  totalSnapshots: number;
  completedSnapshots: number;
  hasBlueprint: boolean;
  blueprintItemsCount: number;
  clientRequestsCount: number;
}

export default function TechPropertiesViewScreen() {
  const insets = useSafeAreaInsets();
  const { properties } = useProperties();
  const { appointments, getAppointmentsByProperty } = useTechAppointments();
  const { snapshots, getSnapshotsByProperty, createSnapshot } = useSnapshots();
  const { currentUser } = useUser();
  const { getSubscription } = useSubscription();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'appointments' | 'snapshots' | 'blueprints'>('all');
  const [showQuickStartModal, setShowQuickStartModal] = useState(false);
  const [selectedQuickStartProperty, setSelectedQuickStartProperty] = useState<Property | null>(null);

  const isTech = currentUser?.role === 'tech';
  const techId = isTech ? currentUser?.id : undefined;

  const propertiesWithData = useMemo<PropertyWithData[]>(() => {
    if (!properties || properties.length === 0) return [];
    
    return properties.map(property => {
      const appointmentsResult = getAppointmentsByProperty(property.id);
      const snapshotsResult = getSnapshotsByProperty(property.id);
      
      let propertyAppointments = Array.isArray(appointmentsResult) ? appointmentsResult : [];
      let propertySnapshots = Array.isArray(snapshotsResult) ? snapshotsResult : [];

      if (techId) {
        propertyAppointments = propertyAppointments.filter(apt => apt.techId === techId);
        propertySnapshots = propertySnapshots.filter(snap => snap.techId === techId);
      }

      const completedAppointments = propertyAppointments.filter(apt => apt.status === 'completed').length;
      const upcomingAppointments = propertyAppointments.filter(apt => 
        apt.status === 'scheduled' && new Date(apt.scheduledDate) >= new Date()
      ).length;

      const completedSnapshots = propertySnapshots.filter(snap => snap.completedAt).length;

      const subscription = getSubscription(property.id);
      const blueprint = subscription?.blueprint;
      const hasBlueprint = !!blueprint;
      const blueprintItemsCount = blueprint?.fiveYearPlan?.items?.length || 0;
      const clientRequestsCount = (blueprint?.customProjects?.length || 0) + (blueprint?.monthlyVisitRequests?.length || 0);

      return {
        property,
        appointments: propertyAppointments,
        snapshots: propertySnapshots,
        totalAppointments: propertyAppointments.length,
        completedAppointments,
        upcomingAppointments,
        totalSnapshots: propertySnapshots.length,
        completedSnapshots,
        hasBlueprint,
        blueprintItemsCount,
        clientRequestsCount,
      };
    });
  }, [properties, appointments, snapshots, techId, getAppointmentsByProperty, getSnapshotsByProperty, getSubscription]);

  const filteredProperties = useMemo(() => {
    return propertiesWithData.filter(item => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!item.property.name.toLowerCase().includes(query) && 
            !item.property.address.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (filterType === 'appointments' && item.totalAppointments === 0) {
        return false;
      }
      if (filterType === 'snapshots' && item.totalSnapshots === 0) {
        return false;
      }
      if (filterType === 'blueprints' && !item.hasBlueprint) {
        return false;
      }

      return true;
    });
  }, [propertiesWithData, searchQuery, filterType]);

  const handleQuickStartSnapshot = async (property: Property) => {
    setSelectedQuickStartProperty(property);
    setShowQuickStartModal(false);
    setTimeout(() => {
      router.push(`/quickstart-snapshot?propertyId=${property.id}` as any);
    }, 100);
  };

  const togglePropertyExpansion = (propertyId: string) => {
    setExpandedPropertyId(expandedPropertyId === propertyId ? null : propertyId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'in-progress':
        return '#F59E0B';
      case 'scheduled':
        return '#3B82F6';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'scheduled':
        return 'Scheduled';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const totalStats = useMemo(() => {
    return filteredProperties.reduce((acc, item) => ({
      properties: acc.properties + 1,
      appointments: acc.appointments + item.totalAppointments,
      snapshots: acc.snapshots + item.totalSnapshots,
      completed: acc.completed + item.completedAppointments + item.completedSnapshots,
    }), { properties: 0, appointments: 0, snapshots: 0, completed: 0 });
  }, [filteredProperties]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ 
        title: 'Properties Overview', 
        headerStyle: { backgroundColor: COLORS.teal }, 
        headerTintColor: COLORS.gold 
      }} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerIconContainer}>
            <Icons.Building2 size={28} color="white" />
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Properties Overview</Text>
            <Text style={styles.headerSubtitle}>
              {isTech ? 'Your assigned properties' : 'All properties'}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icons.Home size={20} color={COLORS.gold} />
            <Text style={styles.statNumber}>{totalStats.properties}</Text>
            <Text style={styles.statLabel}>Properties</Text>
          </View>
          <View style={styles.statCard}>
            <Icons.Calendar size={20} color="#3B82F6" />
            <Text style={styles.statNumber}>{totalStats.appointments}</Text>
            <Text style={styles.statLabel}>Appointments</Text>
          </View>
          <View style={styles.statCard}>
            <Icons.Camera size={20} color="#F59E0B" />
            <Text style={styles.statNumber}>{totalStats.snapshots}</Text>
            <Text style={styles.statLabel}>Snapshots</Text>
          </View>
          <View style={styles.statCard}>
            <Icons.CheckCircle size={20} color="#10B981" />
            <Text style={styles.statNumber}>{totalStats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

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

      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowQuickStartModal(true)}
        >
          <Icons.Zap size={20} color="white" />
          <Text style={styles.quickActionText}>QuickStart Snapshot</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
            onPress={() => setFilterType('all')}
          >
            <Icons.List size={14} color={filterType === 'all' ? 'white' : COLORS.teal} />
            <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'appointments' && styles.filterChipActive]}
            onPress={() => setFilterType('appointments')}
          >
            <Icons.Calendar size={14} color={filterType === 'appointments' ? 'white' : COLORS.teal} />
            <Text style={[styles.filterChipText, filterType === 'appointments' && styles.filterChipTextActive]}>
              Appointments
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'snapshots' && styles.filterChipActive]}
            onPress={() => setFilterType('snapshots')}
          >
            <Icons.Camera size={14} color={filterType === 'snapshots' ? 'white' : COLORS.teal} />
            <Text style={[styles.filterChipText, filterType === 'snapshots' && styles.filterChipTextActive]}>
              Snapshots
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'blueprints' && styles.filterChipActive]}
            onPress={() => setFilterType('blueprints')}
          >
            <Icons.FileText size={14} color={filterType === 'blueprints' ? 'white' : COLORS.teal} />
            <Text style={[styles.filterChipText, filterType === 'blueprints' && styles.filterChipTextActive]}>
              Blueprints
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          {filteredProperties.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Icons.Home size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyText}>No properties found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search' : 'No properties available'}
              </Text>
            </View>
          ) : (
            filteredProperties.map((item) => {
              const isExpanded = expandedPropertyId === item.property.id;
              const hasData = item.totalAppointments > 0 || item.totalSnapshots > 0;

              return (
                <View key={item.property.id} style={styles.propertyCard}>
                  <TouchableOpacity
                    style={styles.propertyHeader}
                    onPress={() => hasData && togglePropertyExpansion(item.property.id)}
                    disabled={!hasData}
                  >
                    <View style={styles.propertyIconBadge}>
                      <Icons.Home size={24} color={COLORS.teal} />
                    </View>
                    <View style={styles.propertyInfo}>
                      <Text style={styles.propertyName}>{item.property.name}</Text>
                      <Text style={styles.propertyAddress}>{item.property.address}</Text>
                      <View style={styles.propertyMetaRow}>
                        <View style={styles.metaBadge}>
                          <Icons.Calendar size={12} color="#3B82F6" />
                          <Text style={styles.metaBadgeText}>{item.totalAppointments}</Text>
                        </View>
                        <View style={styles.metaBadge}>
                          <Icons.Camera size={12} color="#F59E0B" />
                          <Text style={styles.metaBadgeText}>{item.totalSnapshots}</Text>
                        </View>
                        {item.hasBlueprint && (
                          <View style={styles.metaBadge}>
                            <Icons.FileText size={12} color="#8B5CF6" />
                            <Text style={styles.metaBadgeText}>Blueprint</Text>
                          </View>
                        )}
                        {item.upcomingAppointments > 0 && (
                          <View style={[styles.metaBadge, styles.metaBadgeHighlight]}>
                            <Icons.Clock size={12} color="#10B981" />
                            <Text style={[styles.metaBadgeText, styles.metaBadgeTextHighlight]}>
                              {item.upcomingAppointments} upcoming
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {hasData && (
                      <Icons.ChevronDown 
                        size={24} 
                        color="#9CA3AF" 
                        style={[
                          styles.chevron,
                          isExpanded && styles.chevronExpanded
                        ]}
                      />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {item.hasBlueprint && (
                        <View style={styles.dataSection}>
                          <View style={styles.dataSectionHeader}>
                            <Icons.FileText size={18} color="#8B5CF6" />
                            <Text style={styles.dataSectionTitle}>Blueprint & Client Requests</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.blueprintCard}
                            onPress={() => router.push('/blueprint' as any)}
                          >
                            <View style={styles.blueprintHeader}>
                              <View style={styles.blueprintIconBadge}>
                                <Icons.FileText size={20} color="#8B5CF6" />
                              </View>
                              <View style={styles.blueprintInfo}>
                                <Text style={styles.blueprintTitle}>5-Year Property Plan</Text>
                                <Text style={styles.blueprintSubtitle}>
                                  {item.blueprintItemsCount} timeline items
                                </Text>
                              </View>
                              <Icons.ChevronRight size={20} color="#9CA3AF" />
                            </View>
                          </TouchableOpacity>
                          {item.clientRequestsCount > 0 && (
                            <View style={styles.clientRequestsCard}>
                              <View style={styles.clientRequestsHeader}>
                                <Icons.MessageSquare size={16} color="#F59E0B" />
                                <Text style={styles.clientRequestsTitle}>
                                  Client Requests ({item.clientRequestsCount})
                                </Text>
                              </View>
                              <Text style={styles.clientRequestsText}>
                                Custom projects and monthly visit requests from homeowner
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                      {item.appointments.length > 0 && (
                        <View style={styles.dataSection}>
                          <View style={styles.dataSectionHeader}>
                            <Icons.Calendar size={18} color={COLORS.teal} />
                            <Text style={styles.dataSectionTitle}>
                              Appointments ({item.appointments.length})
                            </Text>
                          </View>
                          {item.appointments
                            .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
                            .slice(0, 5)
                            .map((apt) => (
                              <TouchableOpacity
                                key={apt.id}
                                style={styles.itemCard}
                                onPress={() => router.push(`/appointment/${apt.id}` as any)}
                              >
                                <View style={styles.itemHeader}>
                                  <View style={[styles.itemIconBadge, { backgroundColor: apt.type === 'snapshot' ? '#FEF3C7' : '#DBEAFE' }]}>
                                    {apt.type === 'snapshot' ? (
                                      <Icons.Camera size={16} color="#F59E0B" />
                                    ) : (
                                      <Icons.Wrench size={16} color="#3B82F6" />
                                    )}
                                  </View>
                                  <View style={styles.itemInfo}>
                                    <Text style={styles.itemType}>
                                      {apt.type === 'snapshot' ? 'MyHome Snapshot' : 'Standard Home Care'}
                                    </Text>
                                    <Text style={styles.itemDate}>{formatDate(apt.scheduledDate)}</Text>
                                  </View>
                                  <View style={[styles.itemStatusBadge, { backgroundColor: `${getStatusColor(apt.status)}15` }]}>
                                    <View style={[styles.itemStatusDot, { backgroundColor: getStatusColor(apt.status) }]} />
                                    <Text style={[styles.itemStatusText, { color: getStatusColor(apt.status) }]}>
                                      {getStatusLabel(apt.status)}
                                    </Text>
                                  </View>
                                </View>
                                {apt.notes && (
                                  <Text style={styles.itemNotes} numberOfLines={2}>{apt.notes}</Text>
                                )}
                                {apt.type === 'standard' && apt.tasks.length > 0 && (
                                  <View style={styles.itemProgress}>
                                    <Text style={styles.itemProgressText}>
                                      {apt.tasks.filter(t => t.completed).length} / {apt.tasks.length} tasks completed
                                    </Text>
                                  </View>
                                )}
                              </TouchableOpacity>
                            ))}
                        </View>
                      )}

                      {item.snapshots.length > 0 && (
                        <View style={styles.dataSection}>
                          <View style={styles.dataSectionHeader}>
                            <Icons.Camera size={18} color="#F59E0B" />
                            <Text style={styles.dataSectionTitle}>
                              Standalone Snapshots ({item.snapshots.length})
                            </Text>
                          </View>
                          {item.snapshots
                            .filter(snap => !snap.appointmentId)
                            .sort((a, b) => {
                              const dateA = a.completedAt || a.id;
                              const dateB = b.completedAt || b.id;
                              return dateB.localeCompare(dateA);
                            })
                            .map((snap) => (
                              <TouchableOpacity
                                key={snap.id}
                                style={styles.itemCard}
                                onPress={() => router.push(`/snapshot-inspection/${snap.id}` as any)}
                              >
                                <View style={styles.itemHeader}>
                                  <View style={[styles.itemIconBadge, { backgroundColor: '#FEF3C7' }]}>
                                    <Icons.Camera size={16} color="#F59E0B" />
                                  </View>
                                  <View style={styles.itemInfo}>
                                    <Text style={styles.itemType}>Snapshot Inspection</Text>
                                    <Text style={styles.itemDate}>
                                      {snap.completedAt ? formatDate(snap.completedAt) : 'In Progress'}
                                    </Text>
                                  </View>
                                  <View style={[styles.itemStatusBadge, { backgroundColor: snap.completedAt ? '#D1FAE515' : '#FEF3C715' }]}>
                                    <View style={[styles.itemStatusDot, { backgroundColor: snap.completedAt ? '#10B981' : '#F59E0B' }]} />
                                    <Text style={[styles.itemStatusText, { color: snap.completedAt ? '#10B981' : '#F59E0B' }]}>
                                      {snap.completedAt ? 'Completed' : 'In Progress'}
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.snapshotScores}>
                                  <View style={styles.scoreItem}>
                                    <Text style={styles.scoreLabel}>Overall</Text>
                                    <Text style={styles.scoreValue}>{snap.overallScore}</Text>
                                  </View>
                                  <View style={styles.scoreItem}>
                                    <Text style={styles.scoreLabel}>Rooms</Text>
                                    <Text style={styles.scoreValue}>{snap.rooms.length}</Text>
                                  </View>
                                  <View style={styles.scoreItem}>
                                    <Text style={styles.scoreLabel}>Images</Text>
                                    <Text style={styles.scoreValue}>
                                      {snap.generalImages.length + snap.rooms.reduce((sum, r) => sum + r.images.length, 0)}
                                    </Text>
                                  </View>
                                </View>
                              </TouchableOpacity>
                            ))}
                        </View>
                      )}

                      {(item.appointments?.length || 0) === 0 && (item.snapshots?.filter(s => !s.appointmentId)?.length || 0) === 0 && (
                        <View style={styles.noDataState}>
                          <Icons.FileText size={32} color="#D1D5DB" />
                          <Text style={styles.noDataText}>No inspections or appointments yet</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

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
                Start a room-by-room photo inspection. QuickStart guides you through each room with an intuitive camera interface.
              </Text>

              <View style={styles.propertiesList}>
                {filteredProperties.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Icons.Home size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No properties available</Text>
                  </View>
                ) : (
                  filteredProperties.map((item) => (
                    <TouchableOpacity
                      key={item.property.id}
                      style={styles.quickStartPropertyCard}
                      onPress={() => handleQuickStartSnapshot(item.property)}
                    >
                      <View style={styles.quickStartPropertyInfo}>
                        <Icons.Home size={20} color={COLORS.teal} />
                        <View style={styles.quickStartPropertyDetails}>
                          <Text style={styles.quickStartPropertyName}>{item.property.name}</Text>
                          <Text style={styles.quickStartPropertyAddress}>{item.property.address}</Text>
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
  headerTitleContainer: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: 'white',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500' as const,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
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
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.teal,
    backgroundColor: 'white',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.teal,
  },
  filterChipTextActive: {
    color: 'white',
  },
  section: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    gap: 12,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  propertyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  propertyIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 8,
  },
  propertyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaBadgeHighlight: {
    backgroundColor: '#D1FAE5',
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  metaBadgeTextHighlight: {
    color: '#10B981',
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: 16,
    gap: 20,
  },
  dataSection: {
    gap: 12,
  },
  dataSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dataSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  itemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemType: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemStatusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  itemNotes: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  itemProgress: {
    paddingTop: 4,
  },
  itemProgressText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.teal,
  },
  snapshotScores: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  noDataState: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  quickActionsRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: 'white',
  },
  blueprintCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  blueprintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blueprintIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueprintInfo: {
    flex: 1,
  },
  blueprintTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  blueprintSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  clientRequestsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  clientRequestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  clientRequestsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#92400E',
  },
  clientRequestsText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
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
