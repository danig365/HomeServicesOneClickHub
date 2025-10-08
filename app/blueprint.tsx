import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView, Modal, Platform, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { useProperties } from '@/hooks/properties-store';
import { useSubscription } from '@/hooks/subscription-store';
import { useUser } from '@/hooks/user-store';
import { YearlyPlanItem } from '@/types/subscription';
import { COLORS } from '@/constants/colors';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORIES = [
  { value: 'maintenance', label: 'Maintenance', color: '#3B82F6', icon: 'Wrench' },
  { value: 'upgrade', label: 'Upgrade', color: '#8B5CF6', icon: 'TrendingUp' },
  { value: 'repair', label: 'Repair', color: '#EF4444', icon: 'AlertCircle' },
  { value: 'inspection', label: 'Inspection', color: '#F59E0B', icon: 'Search' },
  { value: 'seasonal', label: 'Seasonal', color: '#10B981', icon: 'Calendar' },
  { value: 'project', label: 'Project', color: '#EC4899', icon: 'Hammer' },
] as const;

export default function BlueprintScreen() {
  const { getSelectedProperty } = useProperties();
  const { getSubscription, addPlanItem, updatePlanItem, removePlanItem } = useSubscription();
  const { currentUser } = useUser();
  const property = getSelectedProperty();
  const subscription = property ? getSubscription(property.id) : null;
  const blueprint = subscription?.blueprint;
  const fiveYearPlan = blueprint?.fiveYearPlan;

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<YearlyPlanItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const [itemForm, setItemForm] = useState({
    title: '',
    description: '',
    category: 'maintenance' as YearlyPlanItem['category'],
    priority: 'medium' as 'low' | 'medium' | 'high',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    estimatedCost: '',
    notes: '',
    status: 'planned' as YearlyPlanItem['status'],
  });

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear + i);
  }, []);

  const filteredItems = useMemo(() => {
    if (!fiveYearPlan?.items) return [];
    
    let items = fiveYearPlan.items.filter(item => item.year === selectedYear);
    
    if (filterCategory) {
      items = items.filter(item => item.category === filterCategory);
    }
    
    if (filterStatus) {
      items = items.filter(item => item.status === filterStatus);
    }
    
    return items.sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [fiveYearPlan, selectedYear, filterCategory, filterStatus]);

  const itemsByMonth = useMemo(() => {
    const byMonth: Record<number, YearlyPlanItem[]> = {};
    filteredItems.forEach(item => {
      if (!byMonth[item.month]) byMonth[item.month] = [];
      byMonth[item.month].push(item);
    });
    return byMonth;
  }, [filteredItems]);

  const stats = useMemo(() => {
    if (!fiveYearPlan?.items) return { total: 0, completed: 0, planned: 0, inProgress: 0 };
    
    const yearItems = fiveYearPlan.items.filter(item => item.year === selectedYear);
    return {
      total: yearItems.length,
      completed: yearItems.filter(i => i.status === 'completed').length,
      planned: yearItems.filter(i => i.status === 'planned').length,
      inProgress: yearItems.filter(i => i.status === 'in-progress').length,
    };
  }, [fiveYearPlan, selectedYear]);

  const handleAddItem = async () => {
    if (!property || !currentUser || !itemForm.title.trim()) {
      Alert.alert('Required', 'Please enter a title');
      return;
    }

    try {
      await addPlanItem(
        property.id,
        {
          title: itemForm.title,
          description: itemForm.description,
          category: itemForm.category,
          priority: itemForm.priority,
          year: itemForm.year,
          month: itemForm.month,
          estimatedCost: itemForm.estimatedCost,
          notes: itemForm.notes,
          status: itemForm.status,
          createdBy: currentUser.id,
          createdByRole: currentUser.role,
        },
        currentUser.id,
        currentUser.name,
        currentUser.role
      );
      
      setShowAddModal(false);
      resetForm();
      Alert.alert('Success', 'Item added to timeline');
    } catch {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleUpdateItem = async () => {
    if (!property || !currentUser || !editingItem) return;

    try {
      await updatePlanItem(
        property.id,
        editingItem.id,
        {
          title: itemForm.title,
          description: itemForm.description,
          category: itemForm.category,
          priority: itemForm.priority,
          year: itemForm.year,
          month: itemForm.month,
          estimatedCost: itemForm.estimatedCost,
          notes: itemForm.notes,
          status: itemForm.status,
        },
        currentUser.id,
        currentUser.name,
        currentUser.role
      );
      
      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
      Alert.alert('Success', 'Item updated');
    } catch {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string, title: string) => {
    if (!property || !currentUser) return;

    Alert.alert(
      'Remove Item',
      `Remove "${title}" from the timeline?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removePlanItem(property.id, itemId, currentUser.id, currentUser.name, currentUser.role);
            Alert.alert('Success', 'Item removed');
          },
        },
      ]
    );
  };

  const handleCompleteItem = async (item: YearlyPlanItem) => {
    if (!property || !currentUser) return;

    Alert.alert(
      'Mark as Completed',
      `Mark "${item.title}" as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            await updatePlanItem(
              property.id,
              item.id,
              {
                status: 'completed',
                completedDate: new Date().toISOString(),
              },
              currentUser.id,
              currentUser.name,
              currentUser.role
            );
          },
        },
      ]
    );
  };

  const openEditItem = (item: YearlyPlanItem) => {
    setEditingItem(item);
    setItemForm({
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority,
      year: item.year,
      month: item.month,
      estimatedCost: item.estimatedCost || '',
      notes: item.notes || '',
      status: item.status,
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setItemForm({
      title: '',
      description: '',
      category: 'maintenance',
      priority: 'medium',
      year: selectedYear,
      month: new Date().getMonth() + 1,
      estimatedCost: '',
      notes: '',
      status: 'planned',
    });
  };

  const getCategoryInfo = (category: YearlyPlanItem['category']) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
    }
  };

  const getStatusColor = (status: YearlyPlanItem['status']) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in-progress': return '#3B82F6';
      case 'planned': return '#6B7280';
      case 'skipped': return '#9CA3AF';
    }
  };

  const renderIcon = (iconName: string, size: number, color: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent size={size} color={color} /> : <Icons.Circle size={size} color={color} />;
  };

  if (!blueprint) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Property Timeline',
            headerStyle: { backgroundColor: COLORS.teal },
            headerTintColor: COLORS.cream,
          }}
        />
        <View style={styles.emptyContainer}>
          <Icons.FileText size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Blueprint Yet</Text>
          <Text style={styles.emptyText}>Create a blueprint first to start planning your property's future</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => router.back()}>
            <Text style={styles.createButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Property Timeline',
          headerStyle: { backgroundColor: COLORS.teal },
          headerTintColor: COLORS.cream,
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                setEditingItem(null);
                resetForm();
                setShowAddModal(true);
              }}
              style={{ marginRight: 8 }}
            >
              <Icons.Plus size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>5-Year Property Plan</Text>
              <Text style={styles.headerSubtitle}>Like Carfax for your home</Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Done</Text>
              </View>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearSelector}>
            {years.map(year => (
              <TouchableOpacity
                key={year}
                style={[styles.yearButton, selectedYear === year && styles.yearButtonActive]}
                onPress={() => setSelectedYear(year)}
              >
                <Text style={[styles.yearButtonText, selectedYear === year && styles.yearButtonTextActive]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterChip, !filterCategory && styles.filterChipActive]}
              onPress={() => setFilterCategory(null)}
            >
              <Text style={[styles.filterChipText, !filterCategory && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.filterChip, filterCategory === cat.value && styles.filterChipActive]}
                onPress={() => setFilterCategory(filterCategory === cat.value ? null : cat.value)}
              >
                <View style={[styles.filterDot, { backgroundColor: cat.color }]} />
                <Text style={[styles.filterChipText, filterCategory === cat.value && styles.filterChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.timeline}>
          {MONTHS.map((month, index) => {
            const monthNumber = index + 1;
            const items = itemsByMonth[monthNumber] || [];
            const hasItems = items.length > 0;

            return (
              <View key={month} style={styles.monthSection}>
                <View style={styles.monthHeader}>
                  <View style={styles.monthLabelContainer}>
                    <View style={[styles.monthDot, hasItems && styles.monthDotActive]} />
                    <Text style={[styles.monthLabel, hasItems && styles.monthLabelActive]}>{month}</Text>
                  </View>
                  {hasItems && (
                    <View style={styles.monthBadge}>
                      <Text style={styles.monthBadgeText}>{items.length}</Text>
                    </View>
                  )}
                </View>

                {hasItems && (
                  <View style={styles.monthItems}>
                    {items.map(item => {
                      const categoryInfo = getCategoryInfo(item.category);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.timelineItem,
                            item.status === 'completed' && styles.timelineItemCompleted,
                          ]}
                          onPress={() => openEditItem(item)}
                        >
                          <View style={[styles.itemIndicator, { backgroundColor: categoryInfo.color }]} />
                          
                          <View style={styles.itemContent}>
                            <View style={styles.itemHeader}>
                              <View style={styles.itemTitleRow}>
                                {renderIcon(categoryInfo.icon, 16, categoryInfo.color)}
                                <Text style={[
                                  styles.itemTitle,
                                  item.status === 'completed' && styles.itemTitleCompleted
                                ]}>
                                  {item.title}
                                </Text>
                              </View>
                              <View style={styles.itemBadges}>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                  <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                                    {item.status}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            {item.description && (
                              <Text style={styles.itemDescription} numberOfLines={item.category === 'inspection' ? 20 : 2}>{item.description}</Text>
                            )}
                            
                            {item.photos && item.photos.length > 0 && (
                              <View style={styles.itemPhotosSection}>
                                <Text style={styles.itemPhotosLabel}>📸 {item.photos.length} Photos Attached</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemPhotosScroll}>
                                  {item.photos.slice(0, 5).map((photoUri, idx) => (
                                    <Image
                                      key={idx}
                                      source={{ uri: photoUri }}
                                      style={styles.itemPhotoThumbnail}
                                      resizeMode="cover"
                                    />
                                  ))}
                                  {item.photos.length > 5 && (
                                    <View style={styles.itemPhotoMore}>
                                      <Text style={styles.itemPhotoMoreText}>+{item.photos.length - 5}</Text>
                                    </View>
                                  )}
                                </ScrollView>
                              </View>
                            )}

                            <View style={styles.itemMeta}>
                              {item.estimatedCost && (
                                <View style={styles.metaItem}>
                                  <Icons.DollarSign size={12} color="#6B7280" />
                                  <Text style={styles.metaText}>{item.estimatedCost}</Text>
                                </View>
                              )}
                              <View style={styles.metaItem}>
                                <Icons.User size={12} color="#6B7280" />
                                <Text style={styles.metaText}>
                                  {item.createdByRole === 'tech' ? 'Tech' : 'Owner'}
                                </Text>
                              </View>
                              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
                            </View>

                            <View style={styles.itemActions}>
                              {item.status !== 'completed' && (
                                <TouchableOpacity
                                  style={styles.actionButton}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    handleCompleteItem(item);
                                  }}
                                >
                                  <Icons.CheckCircle size={16} color="#10B981" />
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(item.id, item.title);
                                }}
                              >
                                <Icons.Trash2 size={16} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Icons.Info size={16} color="#6B7280" />
          <Text style={styles.footerText}>
            Both homeowners and techs can add, edit, and complete items. All changes are tracked and both parties are notified.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddModal(false);
          setEditingItem(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Item' : 'Add to Timeline'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setEditingItem(null);
              }}>
                <Icons.X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={itemForm.title}
                onChangeText={(text) => setItemForm(prev => ({ ...prev, title: text }))}
                placeholder="e.g., HVAC Filter Replacement"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={itemForm.description}
                onChangeText={(text) => setItemForm(prev => ({ ...prev, description: text }))}
                placeholder="Add details..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryButton,
                      itemForm.category === cat.value && { backgroundColor: cat.color + '20', borderColor: cat.color }
                    ]}
                    onPress={() => setItemForm(prev => ({ ...prev, category: cat.value }))}
                  >
                    {renderIcon(cat.icon, 18, itemForm.category === cat.value ? cat.color : '#6B7280')}
                    <Text style={[
                      styles.categoryButtonText,
                      itemForm.category === cat.value && { color: cat.color, fontWeight: '600' }
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>Year</Text>
                  <View style={styles.pickerContainer}>
                    {years.map(year => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.pickerButton,
                          itemForm.year === year && styles.pickerButtonActive
                        ]}
                        onPress={() => setItemForm(prev => ({ ...prev, year }))}
                      >
                        <Text style={[
                          styles.pickerButtonText,
                          itemForm.year === year && styles.pickerButtonTextActive
                        ]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>Month</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthPicker}>
                    {MONTHS.map((month, index) => (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.monthPickerButton,
                          itemForm.month === index + 1 && styles.monthPickerButtonActive
                        ]}
                        onPress={() => setItemForm(prev => ({ ...prev, month: index + 1 }))}
                      >
                        <Text style={[
                          styles.monthPickerButtonText,
                          itemForm.month === index + 1 && styles.monthPickerButtonTextActive
                        ]}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityButtons}>
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      itemForm.priority === p && { backgroundColor: getPriorityColor(p) + '20', borderColor: getPriorityColor(p) }
                    ]}
                    onPress={() => setItemForm(prev => ({ ...prev, priority: p }))}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      itemForm.priority === p && { color: getPriorityColor(p), fontWeight: '600' }
                    ]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusButtons}>
                {(['planned', 'in-progress', 'completed', 'skipped'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusButton,
                      itemForm.status === s && { backgroundColor: getStatusColor(s) + '20', borderColor: getStatusColor(s) }
                    ]}
                    onPress={() => setItemForm(prev => ({ ...prev, status: s }))}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      itemForm.status === s && { color: getStatusColor(s), fontWeight: '600' }
                    ]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Estimated Cost</Text>
              <TextInput
                style={styles.input}
                value={itemForm.estimatedCost}
                onChangeText={(text) => setItemForm(prev => ({ ...prev, estimatedCost: text }))}
                placeholder="e.g., $500"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={itemForm.notes}
                onChangeText={(text) => setItemForm(prev => ({ ...prev, notes: text }))}
                placeholder="Additional notes..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={editingItem ? handleUpdateItem : handleAddItem}
            >
              <Text style={styles.modalButtonText}>
                {editingItem ? 'Update Item' : 'Add to Timeline'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.teal,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  yearSelector: {
    marginBottom: 16,
  },
  yearButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  yearButtonActive: {
    backgroundColor: COLORS.teal,
  },
  yearButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  yearButtonTextActive: {
    color: 'white',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.teal + '20',
    borderWidth: 1,
    borderColor: COLORS.teal,
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: COLORS.teal,
    fontWeight: '600' as const,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeline: {
    padding: 20,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  monthDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  monthDotActive: {
    backgroundColor: COLORS.teal,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#9CA3AF',
  },
  monthLabelActive: {
    color: '#111827',
    fontSize: 18,
  },
  monthBadge: {
    backgroundColor: COLORS.teal + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.teal,
  },
  monthItems: {
    gap: 12,
    paddingLeft: 24,
  },
  timelineItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  timelineItemCompleted: {
    opacity: 0.7,
  },
  itemIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  itemBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  itemDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  itemPhotosSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  itemPhotosLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 8,
  },
  itemPhotosScroll: {
    flexDirection: 'row',
  },
  itemPhotoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  itemPhotoMore: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPhotoMoreText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#6B7280',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 20,
    marginBottom: 40,
  },
  footerText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
    maxHeight: '90%',
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pickerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  pickerButtonActive: {
    backgroundColor: COLORS.teal + '20',
    borderColor: COLORS.teal,
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  pickerButtonTextActive: {
    color: COLORS.teal,
    fontWeight: '600' as const,
  },
  monthPicker: {
    flexDirection: 'row',
  },
  monthPickerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    marginRight: 6,
  },
  monthPickerButtonActive: {
    backgroundColor: COLORS.teal + '20',
    borderColor: COLORS.teal,
  },
  monthPickerButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  monthPickerButtonTextActive: {
    color: COLORS.teal,
    fontWeight: '600' as const,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
    textTransform: 'capitalize',
  },
  modalButton: {
    backgroundColor: COLORS.gold,
    margin: 20,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'white',
  },
});
