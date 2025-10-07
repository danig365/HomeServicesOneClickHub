import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import { useProperties } from '@/hooks/properties-store';
import { useUser } from '@/hooks/user-store';
import { PropertyReminder } from '@/types/property';
import { COLORS } from '@/constants/colors';

export default function PropertyRemindersScreen() {
  const { getSelectedProperty, addReminder, updateReminder, deleteReminder, completeReminder, getUpcomingReminders, getOverdueReminders } = useProperties();
  const { currentUser } = useUser();
  const property = getSelectedProperty();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<PropertyReminder | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    type: 'maintenance' as PropertyReminder['type'],
    priority: 'medium' as PropertyReminder['priority'],
    recurring: false,
    recurringInterval: 30,
  });

  if (!property) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Property Reminders', headerStyle: { backgroundColor: COLORS.teal }, headerTintColor: 'white' }} />
        <View style={styles.emptyState}>
          <Icons.Bell size={64} color={COLORS.text.light} />
          <Text style={styles.emptyTitle}>No Property Selected</Text>
          <Text style={styles.emptyText}>Please select a property to view reminders</Text>
        </View>
      </View>
    );
  }

  const upcomingReminders = getUpcomingReminders(property.id);
  const overdueReminders = getOverdueReminders(property.id);
  const completedReminders = (property.reminders || []).filter(r => r.completed);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleAddReminder = () => {
    setEditingReminder(null);
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      type: 'maintenance',
      priority: 'medium',
      recurring: false,
      recurringInterval: 30,
    });
    setShowAddModal(true);
  };

  const handleEditReminder = (reminder: PropertyReminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      dueDate: reminder.dueDate.split('T')[0],
      type: reminder.type,
      priority: reminder.priority,
      recurring: reminder.recurring || false,
      recurringInterval: reminder.recurringInterval || 30,
    });
    setShowAddModal(true);
  };

  const handleSaveReminder = async () => {
    if (!formData.title.trim() || !formData.dueDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const reminderData = {
      title: formData.title,
      description: formData.description,
      dueDate: new Date(formData.dueDate).toISOString(),
      type: formData.type,
      priority: formData.priority,
      recurring: formData.recurring,
      recurringInterval: formData.recurring ? formData.recurringInterval : undefined,
      completed: false,
      createdBy: currentUser?.name || 'Unknown',
      createdByRole: currentUser?.role || 'homeowner',
    };

    try {
      if (editingReminder) {
        await updateReminder(property.id, editingReminder.id, reminderData);
        Alert.alert('Success', 'Reminder updated successfully');
      } else {
        await addReminder(property.id, reminderData);
        Alert.alert('Success', 'Reminder added successfully');
      }
      setShowAddModal(false);
    } catch {
      Alert.alert('Error', 'Failed to save reminder');
    }
  };

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      await completeReminder(property.id, reminderId);
      Alert.alert('Success', 'Reminder marked as complete');
    } catch {
      Alert.alert('Error', 'Failed to complete reminder');
    }
  };

  const handleDeleteReminder = (reminderId: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReminder(property.id, reminderId);
              Alert.alert('Success', 'Reminder deleted successfully');
            } catch {
              Alert.alert('Error', 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const getTypeIcon = (type: PropertyReminder['type']) => {
    const icons = {
      maintenance: Icons.Wrench,
      inspection: Icons.ClipboardCheck,
      payment: Icons.DollarSign,
      renewal: Icons.RefreshCw,
      custom: Icons.Star,
    };
    return icons[type];
  };

  const getPriorityColor = (priority: PropertyReminder['priority']) => {
    const colors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
    };
    return colors[priority];
  };

  const renderReminder = (reminder: PropertyReminder, isOverdue: boolean = false) => {
    const Icon = getTypeIcon(reminder.type);
    const priorityColor = getPriorityColor(reminder.priority);
    const daysUntil = getDaysUntil(reminder.dueDate);

    return (
      <View key={reminder.id} style={[styles.reminderCard, isOverdue && styles.reminderCardOverdue]}>
        <View style={styles.reminderHeader}>
          <View style={styles.reminderLeft}>
            <View style={[styles.reminderIconWrapper, { backgroundColor: `${priorityColor}20` }]}>
              <Icon size={20} color={priorityColor} />
            </View>
            <View style={styles.reminderInfo}>
              <Text style={styles.reminderTitle}>{reminder.title}</Text>
              <Text style={styles.reminderType}>{reminder.type}</Text>
            </View>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}>
            <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
              {reminder.priority}
            </Text>
          </View>
        </View>

        {reminder.description && (
          <Text style={styles.reminderDescription}>{reminder.description}</Text>
        )}

        <View style={styles.reminderFooter}>
          <View style={styles.reminderDate}>
            <Icons.Calendar size={16} color={isOverdue ? COLORS.accent.error : COLORS.text.secondary} />
            <Text style={[styles.reminderDateText, isOverdue && styles.reminderDateOverdue]}>
              {formatDate(reminder.dueDate)}
              {!reminder.completed && (
                <Text style={styles.reminderDaysText}>
                  {' '}({isOverdue ? `${Math.abs(daysUntil)} days overdue` : `in ${daysUntil} days`})
                </Text>
              )}
            </Text>
          </View>
          {reminder.recurring && (
            <View style={styles.recurringBadge}>
              <Icons.RefreshCw size={12} color={COLORS.teal} />
              <Text style={styles.recurringBadgeText}>Every {reminder.recurringInterval} days</Text>
            </View>
          )}
        </View>

        <View style={styles.reminderActions}>
          {!reminder.completed && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCompleteReminder(reminder.id)}
            >
              <Icons.CheckCircle size={18} color={COLORS.accent.success} />
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditReminder(reminder)}
          >
            <Icons.Edit2 size={18} color={COLORS.teal} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteReminder(reminder.id)}
          >
            <Icons.Trash2 size={18} color={COLORS.accent.error} />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Property Reminders',
          headerStyle: { backgroundColor: COLORS.teal },
          headerTintColor: 'white',
        }} 
      />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{property.name}</Text>
              <Text style={styles.headerSubtitle}>Manage your property reminders</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddReminder}>
              <Icons.Plus size={24} color="white" />
            </TouchableOpacity>
          </View>

          {overdueReminders.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icons.AlertCircle size={20} color={COLORS.accent.error} />
                <Text style={[styles.sectionTitle, { color: COLORS.accent.error }]}>
                  Overdue ({overdueReminders.length})
                </Text>
              </View>
              {overdueReminders.map(reminder => renderReminder(reminder, true))}
            </View>
          )}

          {upcomingReminders.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icons.Clock size={20} color={COLORS.teal} />
                <Text style={styles.sectionTitle}>Upcoming ({upcomingReminders.length})</Text>
              </View>
              {upcomingReminders.map(reminder => renderReminder(reminder))}
            </View>
          )}

          {completedReminders.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icons.CheckCircle size={20} color={COLORS.accent.success} />
                <Text style={styles.sectionTitle}>Completed ({completedReminders.length})</Text>
              </View>
              {completedReminders.map(reminder => (
                <View key={reminder.id} style={styles.completedCard}>
                  <View style={styles.completedHeader}>
                    <Text style={styles.completedTitle}>{reminder.title}</Text>
                    <Text style={styles.completedDate}>
                      {reminder.completedDate && formatDate(reminder.completedDate)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteCompletedButton}
                    onPress={() => handleDeleteReminder(reminder.id)}
                  >
                    <Icons.Trash2 size={16} color={COLORS.text.secondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {overdueReminders.length === 0 && upcomingReminders.length === 0 && completedReminders.length === 0 && (
            <View style={styles.emptyState}>
              <Icons.Bell size={64} color={COLORS.text.light} />
              <Text style={styles.emptyTitle}>No Reminders</Text>
              <Text style={styles.emptyText}>Add your first reminder to get started</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingReminder ? 'Edit Reminder' : 'Add Reminder'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icons.X size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="e.g., Replace HVAC filter"
                  placeholderTextColor={COLORS.text.light}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Additional details..."
                  placeholderTextColor={COLORS.text.light}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Due Date *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.dueDate}
                  onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.text.light}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeButtons}>
                  {(['maintenance', 'inspection', 'payment', 'renewal', 'custom'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        formData.type === type && styles.typeButtonActive
                      ]}
                      onPress={() => setFormData({ ...formData, type })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          formData.type === type && styles.typeButtonTextActive
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.priorityButtons}>
                  {(['low', 'medium', 'high'] as const).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityButton,
                        formData.priority === priority && styles.priorityButtonActive,
                        { borderColor: getPriorityColor(priority) }
                      ]}
                      onPress={() => setFormData({ ...formData, priority })}
                    >
                      <Text
                        style={[
                          styles.priorityButtonText,
                          formData.priority === priority && { color: getPriorityColor(priority) }
                        ]}
                      >
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setFormData({ ...formData, recurring: !formData.recurring })}
              >
                <View style={[styles.checkbox, formData.recurring && styles.checkboxChecked]}>
                  {formData.recurring && <Icons.Check size={16} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>Recurring reminder</Text>
              </TouchableOpacity>

              {formData.recurring && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Repeat every (days)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.recurringInterval.toString()}
                    onChangeText={(text) => setFormData({ ...formData, recurringInterval: parseInt(text) || 30 })}
                    placeholder="30"
                    placeholderTextColor={COLORS.text.light}
                    keyboardType="numeric"
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveReminder}>
                <Text style={styles.saveButtonText}>
                  {editingReminder ? 'Update' : 'Add'} Reminder
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.teal,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
  },
  reminderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reminderCardOverdue: {
    borderColor: COLORS.accent.error,
    borderWidth: 2,
  },
  reminderHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  reminderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  reminderIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  reminderType: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textTransform: 'capitalize' as const,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  reminderDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  reminderFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  reminderDate: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  reminderDateText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  reminderDateOverdue: {
    color: COLORS.accent.error,
    fontWeight: '600' as const,
  },
  reminderDaysText: {
    fontSize: 12,
    fontStyle: 'italic' as const,
  },
  recurringBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recurringBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: COLORS.teal,
  },
  reminderActions: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.secondary,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background.secondary,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
  },
  completedCard: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
    opacity: 0.7,
  },
  completedHeader: {
    flex: 1,
  },
  completedTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginBottom: 4,
    textDecorationLine: 'line-through' as const,
  },
  completedDate: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  deleteCompletedButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
  },
  modalScroll: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
  },
  textArea: {
    minHeight: 100,
  },
  typeButtons: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
  },
  typeButtonActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: COLORS.text.secondary,
    textTransform: 'capitalize' as const,
  },
  typeButtonTextActive: {
    color: 'white',
  },
  priorityButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 2,
    alignItems: 'center' as const,
  },
  priorityButtonActive: {
    backgroundColor: 'white',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.text.secondary,
    textTransform: 'capitalize' as const,
  },
  checkboxRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.text.light,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkboxChecked: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500' as const,
  },
  modalFooter: {
    flexDirection: 'row' as const,
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.secondary,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text.secondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.teal,
    alignItems: 'center' as const,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
});
