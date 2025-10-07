import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/hooks/auth-store';
import { useRouter } from 'expo-router';
import { User, UserRole } from '@/types/user';
import { Users, Trash2, Shield, Search, Calendar, Mail, Phone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TEAL = '#14B8A6';
const CREAM = '#FFF8E7';

interface UserWithCreatedAt extends User {
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, getAllUsers, deleteUser, updateUserRole } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<UserWithCreatedAt[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/(tabs)/(home)');
    }
  }, [user, router]);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoadingUsers(true);
      const users = await getAllUsers();
      setAllUsers(users as UserWithCreatedAt[]);
      setIsLoadingUsers(false);
    };
    
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user, getAllUsers]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchesSearch = 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone.includes(searchQuery);
      
      const matchesRole = selectedRole === 'all' || u.role === selectedRole;
      
      return matchesSearch && matchesRole;
    });
  }, [allUsers, searchQuery, selectedRole]);

  const stats = useMemo(() => {
    return {
      total: allUsers.length,
      admins: allUsers.filter(u => u.role === 'admin').length,
      techs: allUsers.filter(u => u.role === 'tech').length,
      homeowners: allUsers.filter(u => u.role === 'homeowner').length,
    };
  }, [allUsers]);

  if (user?.role !== 'admin') {
    return null;
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(userId);
            const success = await deleteUser(userId);
            setIsDeleting(null);
            
            if (success) {
              Alert.alert('Success', 'User deleted successfully');
              const users = await getAllUsers();
              setAllUsers(users as UserWithCreatedAt[]);
            } else {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = async (userId: string, currentRole: UserRole, userName: string) => {
    const roles: UserRole[] = ['admin', 'tech', 'homeowner'];
    const roleOptions = roles.filter(r => r !== currentRole);

    Alert.alert(
      'Change User Role',
      `Select new role for ${userName}`,
      [
        ...roleOptions.map(role => ({
          text: role.charAt(0).toUpperCase() + role.slice(1),
          onPress: async () => {
            const success = await updateUserRole(userId, role);
            if (success) {
              Alert.alert('Success', `User role updated to ${role}`);
              const users = await getAllUsers();
              setAllUsers(users as UserWithCreatedAt[]);
            } else {
              Alert.alert('Error', 'Failed to update user role');
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: UserRole) => {
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
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <View style={styles.headerTop}>
          <Users size={32} color={TEAL} />
          <Text style={styles.headerTitle}>User Management</Text>
        </View>
        <Text style={styles.headerSubtitle}>Manage all users and permissions</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
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

      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilters}>
          {(['all', 'admin', 'tech', 'homeowner'] as const).map(role => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleFilterButton,
                selectedRole === role && styles.roleFilterButtonActive,
              ]}
              onPress={() => setSelectedRole(role)}
            >
              <Text
                style={[
                  styles.roleFilterText,
                  selectedRole === role && styles.roleFilterTextActive,
                ]}
              >
                {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.usersList} showsVerticalScrollIndicator={false}>
        {isLoadingUsers ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={TEAL} />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : filteredUsers.map(u => (
          <View key={u.id} style={styles.userCard}>
            <View style={styles.userCardHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.name}</Text>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: getRoleBadgeColor(u.role) },
                  ]}
                >
                  <Text style={styles.roleBadgeText}>
                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleChangeRole(u.id, u.role, u.name)}
                >
                  <Shield size={20} color={TEAL} />
                </TouchableOpacity>
                {u.id !== user?.id && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteUser(u.id, u.name)}
                    disabled={isDeleting === u.id}
                  >
                    {isDeleting === u.id ? (
                      <ActivityIndicator size="small" color="#DC2626" />
                    ) : (
                      <Trash2 size={20} color="#DC2626" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.userDetails}>
              <View style={styles.userDetailRow}>
                <Mail size={16} color="#6B7280" />
                <Text style={styles.userDetailText}>{u.email}</Text>
              </View>
              <View style={styles.userDetailRow}>
                <Phone size={16} color="#6B7280" />
                <Text style={styles.userDetailText}>{u.phone}</Text>
              </View>
              <View style={styles.userDetailRow}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.userDetailText}>
                  Joined {formatDate(u.createdAt)}
                </Text>
              </View>
            </View>

            {u.role === 'tech' && u.assignedProperties && u.assignedProperties.length > 0 && (
              <View style={styles.assignedProperties}>
                <Text style={styles.assignedPropertiesLabel}>
                  Assigned Properties: {u.assignedProperties.length}
                </Text>
              </View>
            )}
          </View>
        ))}

        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <Users size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No users found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  header: {
    backgroundColor: 'white',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
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
  filtersContainer: {
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1F2937',
  },
  roleFilters: {
    flexDirection: 'row',
  },
  roleFilterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleFilterButtonActive: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  roleFilterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  roleFilterTextActive: {
    color: CREAM,
  },
  usersList: {
    flex: 1,
    padding: 16,
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
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    gap: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'white',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    gap: 8,
  },
  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  assignedProperties: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  assignedPropertiesLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: TEAL,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});
