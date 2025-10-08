import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { useAuth } from '@/hooks/auth-store';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Store,
  Users,
  UserCog,
  CreditCard,
  Plus,
  X,
  Edit2,
  Trash2,
  Save,
  DollarSign,
  Package,
  Shield,
  Calendar,
} from 'lucide-react-native';
import { Service } from '@/types/service';
import { User } from '@/types/user';
import { useProperties } from '@/hooks/properties-store';
import { useSubscription } from '@/hooks/subscription-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TEAL = '#14B8A6';
const CREAM = '#FFF8E7';

type TabType = 'services' | 'users' | 'subscriptions' | 'techs';

const SERVICES_STORAGE_KEY = 'hudson_services';

export default function AdminPortal() {
  const { user, getAllUsers, updateUserRole, deleteUser } = useAuth();
  const { properties } = useProperties();
  const { subscriptions, createSubscription, cancelSubscription } = useSubscription();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('services');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  React.useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/(tabs)/(home)');
    }
  }, [user, router]);

  const loadServices = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SERVICES_STORAGE_KEY);
      if (stored) {
        setServices(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    const users = await getAllUsers();
    setAllUsers(users);
  }, [getAllUsers]);

  React.useEffect(() => {
    loadServices();
    loadUsers();
  }, [loadServices, loadUsers]);

  const saveServices = async (newServices: Service[]) => {
    try {
      await AsyncStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(newServices));
      setServices(newServices);
    } catch (error) {
      console.error('Failed to save services:', error);
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  const tabs = [
    { id: 'services' as const, label: 'Services', icon: Store },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'subscriptions' as const, label: 'Subscriptions', icon: CreditCard },
    { id: 'techs' as const, label: 'Tech Assignments', icon: UserCog },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Shield size={32} color={TEAL} />
          <Text style={styles.headerTitle}>Admin Portal</Text>
        </View>
        <Text style={styles.headerSubtitle}>Manage services, users, and subscriptions</Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Icon size={20} color={activeTab === tab.id ? CREAM : '#6B7280'} />
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'services' && (
          <ServicesTab
            services={services}
            onAddService={() => {
              setEditingService(null);
              setShowServiceModal(true);
            }}
            onEditService={(service) => {
              setEditingService(service);
              setShowServiceModal(true);
            }}
            onDeleteService={(serviceId) => {
              Alert.alert(
                'Delete Service',
                'Are you sure you want to delete this service?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      const updated = services.filter((s) => s.id !== serviceId);
                      await saveServices(updated);
                    },
                  },
                ]
              );
            }}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={allUsers}
            onRefresh={loadUsers}
            onChangeRole={async (userId, newRole) => {
              const success = await updateUserRole(userId, newRole);
              if (success) {
                Alert.alert('Success', 'User role updated');
                loadUsers();
              } else {
                Alert.alert('Error', 'Failed to update user role');
              }
            }}
            onDeleteUser={async (userId, userName) => {
              Alert.alert(
                'Delete User',
                `Are you sure you want to delete ${userName}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      const success = await deleteUser(userId);
                      if (success) {
                        Alert.alert('Success', 'User deleted');
                        loadUsers();
                      } else {
                        Alert.alert('Error', 'Failed to delete user');
                      }
                    },
                  },
                ]
              );
            }}
          />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionsTab
            properties={properties}
            subscriptions={subscriptions}
            onCreateSubscription={async (propertyId) => {
              await createSubscription(propertyId);
              Alert.alert('Success', 'Subscription created');
            }}
            onCancelSubscription={async (propertyId) => {
              Alert.alert(
                'Cancel Subscription',
                'Are you sure you want to cancel this subscription?',
                [
                  { text: 'No', style: 'cancel' },
                  {
                    text: 'Yes',
                    style: 'destructive',
                    onPress: async () => {
                      await cancelSubscription(propertyId);
                      Alert.alert('Success', 'Subscription cancelled');
                    },
                  },
                ]
              );
            }}
          />
        )}

        {activeTab === 'techs' && (
          <TechAssignmentsTab users={allUsers.filter((u) => u.role === 'tech')} properties={properties} />
        )}
      </ScrollView>

      <ServiceModal
        visible={showServiceModal}
        service={editingService}
        onClose={() => {
          setShowServiceModal(false);
          setEditingService(null);
        }}
        onSave={async (service) => {
          if (editingService) {
            const updated = services.map((s) => (s.id === service.id ? service : s));
            await saveServices(updated);
          } else {
            const newService = { ...service, id: Date.now().toString() };
            await saveServices([...services, newService]);
          }
          setShowServiceModal(false);
          setEditingService(null);
          Alert.alert('Success', 'Service saved');
        }}
      />
    </View>
  );
}

function ServicesTab({
  services,
  onAddService,
  onEditService,
  onDeleteService,
}: {
  services: Service[];
  onAddService: () => void;
  onEditService: (service: Service) => void;
  onDeleteService: (serviceId: string) => void;
}) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Store Services</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddService}>
          <Plus size={20} color={CREAM} />
          <Text style={styles.addButtonText}>Add Service</Text>
        </TouchableOpacity>
      </View>

      {services.length === 0 ? (
        <View style={styles.emptyState}>
          <Package size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>No services yet</Text>
          <Text style={styles.emptyStateSubtext}>Add your first service to get started</Text>
        </View>
      ) : (
        services.map((service) => (
          <View key={service.id} style={styles.serviceCard}>
            <View style={styles.serviceCardHeader}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceCategory}>{service.category}</Text>
              </View>
              <View style={styles.serviceActions}>
                <TouchableOpacity style={styles.iconButton} onPress={() => onEditService(service)}>
                  <Edit2 size={18} color={TEAL} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={() => onDeleteService(service.id)}>
                  <Trash2 size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.serviceDescription}>{service.description}</Text>
            <View style={styles.serviceDetails}>
              <View style={styles.serviceDetailItem}>
                <DollarSign size={16} color="#6B7280" />
                <Text style={styles.serviceDetailText}>${service.price}</Text>
              </View>
              <View style={styles.serviceDetailItem}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.serviceDetailText}>{service.frequency}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function UsersTab({
  users,
  onRefresh,
  onChangeRole,
  onDeleteUser,
}: {
  users: User[];
  onRefresh: () => void;
  onChangeRole: (userId: string, newRole: 'admin' | 'tech' | 'homeowner') => void;
  onDeleteUser: (userId: string, userName: string) => void;
}) {
  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === 'admin').length,
      techs: users.filter((u) => u.role === 'tech').length,
      homeowners: users.filter((u) => u.role === 'homeowner').length,
    };
  }, [users]);

  return (
    <View style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.admins}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.techs}</Text>
          <Text style={styles.statLabel}>Techs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#059669' }]}>{stats.homeowners}</Text>
          <Text style={styles.statLabel}>Homeowners</Text>
        </View>
      </View>

      {users.map((user) => (
        <View key={user.id} style={styles.userCard}>
          <View style={styles.userCardHeader}>
            <View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  Alert.alert('Change Role', 'Select new role', [
                    { text: 'Admin', onPress: () => onChangeRole(user.id, 'admin') },
                    { text: 'Tech', onPress: () => onChangeRole(user.id, 'tech') },
                    { text: 'Homeowner', onPress: () => onChangeRole(user.id, 'homeowner') },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
              >
                <Shield size={18} color={TEAL} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => onDeleteUser(user.id, user.name)}>
                <Trash2 size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user.role) }]}>
            <Text style={styles.roleBadgeText}>{user.role.toUpperCase()}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function SubscriptionsTab({
  properties,
  subscriptions,
  onCreateSubscription,
  onCancelSubscription,
}: {
  properties: any[];
  subscriptions: Record<string, any>;
  onCreateSubscription: (propertyId: string) => void;
  onCancelSubscription: (propertyId: string) => void;
}) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Property Subscriptions</Text>

      {properties.map((property) => {
        const subscription = subscriptions[property.id];
        return (
          <View key={property.id} style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View>
                <Text style={styles.propertyName}>{property.name}</Text>
                <Text style={styles.propertyAddress}>{property.address}</Text>
              </View>
              {subscription ? (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        subscription.status === 'active'
                          ? '#10B981'
                          : subscription.status === 'inactive'
                          ? '#F59E0B'
                          : '#EF4444',
                    },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{subscription.status.toUpperCase()}</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: '#6B7280' }]}>
                  <Text style={styles.statusBadgeText}>NO SUBSCRIPTION</Text>
                </View>
              )}
            </View>

            {subscription ? (
              <View style={styles.subscriptionDetails}>
                <Text style={styles.subscriptionDetailText}>
                  Monthly: ${subscription.monthlyPrice}
                </Text>
                <Text style={styles.subscriptionDetailText}>
                  Next Billing: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                </Text>
                {subscription.status === 'active' && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => onCancelSubscription(property.id)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => onCreateSubscription(property.id)}
              >
                <Plus size={20} color={CREAM} />
                <Text style={styles.createButtonText}>Create Subscription</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

function TechAssignmentsTab({ users, properties }: { users: User[]; properties: any[] }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Tech Assignments</Text>

      {users.map((tech) => (
        <View key={tech.id} style={styles.techCard}>
          <Text style={styles.techName}>{tech.name}</Text>
          <Text style={styles.techEmail}>{tech.email}</Text>
          <View style={styles.assignedProperties}>
            <Text style={styles.assignedPropertiesLabel}>
              Assigned Properties: {tech.assignedProperties?.length || 0}
            </Text>
            {tech.assignedProperties?.map((propId) => {
              const property = properties.find((p) => p.id === propId);
              return property ? (
                <View key={propId} style={styles.assignedPropertyItem}>
                  <Text style={styles.assignedPropertyText}>{property.name}</Text>
                </View>
              ) : null;
            })}
          </View>
        </View>
      ))}

      {users.length === 0 && (
        <View style={styles.emptyState}>
          <UserCog size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>No techs found</Text>
        </View>
      )}
    </View>
  );
}

function ServiceModal({
  visible,
  service,
  onClose,
  onSave,
}: {
  visible: boolean;
  service: Service | null;
  onClose: () => void;
  onSave: (service: Service) => void;
}) {
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    category: 'Cleaning',
    price: 0,
    frequency: 'one-time',
    description: '',
    icon: 'Package',
    estimatedDuration: '1-2 hours',
    included: [],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    popular: false,
    requiresLicense: false,
  });

  React.useEffect(() => {
    if (service) {
      setFormData(service);
    } else {
      setFormData({
        name: '',
        category: 'Cleaning',
        price: 0,
        frequency: 'one-time',
        description: '',
        icon: 'Package',
        estimatedDuration: '1-2 hours',
        included: [],
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        popular: false,
        requiresLicense: false,
      });
    }
  }, [service, visible]);

  const handleSave = () => {
    if (!formData.name || !formData.description || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    onSave({
      ...formData,
      id: service?.id || Date.now().toString(),
    } as Service);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{service ? 'Edit Service' : 'Add Service'}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Service Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter service name"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryButtons}>
              {['Cleaning', 'Outdoor', 'HVAC', 'Maintenance', 'Seasonal'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    formData.category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat })}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      formData.category === cat && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Price *</Text>
            <TextInput
              style={styles.input}
              value={formData.price?.toString()}
              onChangeText={(text) => setFormData({ ...formData, price: parseFloat(text) || 0 })}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Frequency</Text>
            <View style={styles.categoryButtons}>
              {['one-time', 'monthly', 'quarterly', 'bi-annual', 'annual'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.categoryButton,
                    formData.frequency === freq && styles.categoryButtonActive,
                  ]}
                  onPress={() =>
                    setFormData({
                      ...formData,
                      frequency: freq as Service['frequency'],
                    })
                  }
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      formData.frequency === freq && styles.categoryButtonTextActive,
                    ]}
                  >
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter service description"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Estimated Duration</Text>
            <TextInput
              style={styles.input}
              value={formData.estimatedDuration}
              onChangeText={(text) => setFormData({ ...formData, estimatedDuration: text })}
              placeholder="e.g., 1-2 hours"
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.switchRow}>
              <Text style={styles.inputLabel}>Popular Service</Text>
              <Switch
                value={formData.popular}
                onValueChange={(value) => setFormData({ ...formData, popular: value })}
                trackColor={{ false: '#D1D5DB', true: TEAL }}
                thumbColor={CREAM}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.inputLabel}>Requires License</Text>
              <Switch
                value={formData.requiresLicense}
                onValueChange={(value) => setFormData({ ...formData, requiresLicense: value })}
                trackColor={{ false: '#D1D5DB', true: TEAL }}
                thumbColor={CREAM}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelModalButton} onPress={onClose}>
              <Text style={styles.cancelModalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save size={20} color={CREAM} />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'admin':
      return '#DC2626';
    case 'tech':
      return '#2563EB';
    case 'homeowner':
      return '#059669';
    default:
      return '#6B7280';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  header: {
    backgroundColor: 'white',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  tabsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: TEAL,
    backgroundColor: '#F0FDFA',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  tabTextActive: {
    color: TEAL,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TEAL,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: CREAM,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 14,
    color: TEAL,
    fontWeight: '600' as const,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  serviceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: TEAL,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'white',
  },
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'white',
  },
  subscriptionDetails: {
    gap: 8,
  },
  subscriptionDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: TEAL,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: CREAM,
  },
  techCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  techName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  techEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  assignedProperties: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  assignedPropertiesLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: TEAL,
    marginBottom: 8,
  },
  assignedPropertyItem: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  assignedPropertyText: {
    fontSize: 14,
    color: TEAL,
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
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  modalBody: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: CREAM,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: TEAL,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: CREAM,
  },
});
