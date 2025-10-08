import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView, Modal } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { useProperties } from '@/hooks/properties-store';
import { useSubscription } from '@/hooks/subscription-store';
import { useUser } from '@/hooks/user-store';
import { MyHomeBlueprint, CustomProject, MonthlyVisitRequest, BlueprintHistoryEntry } from '@/types/subscription';
import { COLORS } from '@/constants/colors';

export default function BlueprintScreen() {
  const { getSelectedProperty } = useProperties();
  const { getSubscription, updateBlueprint, addCustomProject, removeCustomProject, updateCustomProject, addMonthlyVisitRequest, removeMonthlyVisitRequest, getUnreadNotifications, markNotificationAsRead } = useSubscription();
  const { currentUser } = useUser();
  const property = getSelectedProperty();
  const subscription = property ? getSubscription(property.id) : null;
  const existingBlueprint = subscription?.blueprint;

  const [mode, setMode] = useState<'view' | 'edit' | 'create' | 'history'>(existingBlueprint ? 'view' : 'create');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingProject, setEditingProject] = useState<CustomProject | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifications = useMemo(() => {
    if (!property || !currentUser) return [];
    return getUnreadNotifications(property.id, currentUser.role);
  }, [property, currentUser, getUnreadNotifications]);

  const [formData, setFormData] = useState({
    goals: existingBlueprint?.fiveYearGoals.join('\n') || '',
    priorities: existingBlueprint?.priorityAreas || [],
    budget: existingBlueprint?.budgetRange || '',
    timeline: existingBlueprint?.timeline || '',
  });

  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    estimatedCost: '',
    targetDate: '',
    notes: '',
  });

  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    estimatedTime: '',
  });

  const handleCreateBlueprint = async () => {
    if (!property || !currentUser) {
      Alert.alert('Error', 'No property selected or user not logged in');
      return;
    }

    if (!formData.goals.trim()) {
      Alert.alert('Required', 'Please enter your 5-year goals');
      return;
    }

    console.log('[Blueprint] Creating blueprint for property:', property.id);

    const blueprint: MyHomeBlueprint = {
      id: `blueprint-${Date.now()}`,
      propertyId: property.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fiveYearGoals: formData.goals.split('\n').filter(g => g.trim()),
      priorityAreas: formData.priorities,
      customProjects: [],
      monthlyVisitRequests: [],
      budgetRange: formData.budget,
      timeline: formData.timeline,
      history: [{
        id: `history-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'created',
        description: `${currentUser.name} created the blueprint`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
      }],
      notifications: [],
    };

    try {
      await updateBlueprint(property.id, blueprint);
      console.log('[Blueprint] Blueprint saved successfully');
      
      Alert.alert(
        'Blueprint Created!',
        'Your MyHome Blueprint has been saved.',
        [
          { text: 'OK', onPress: () => setMode('view') }
        ]
      );
    } catch (error) {
      console.error('[Blueprint] Failed to save blueprint:', error);
      Alert.alert('Error', 'Failed to save blueprint. Please try again.');
    }
  };

  const handleUpdateBlueprint = async () => {
    if (!property || !existingBlueprint || !currentUser) return;

    const updatedBlueprint: MyHomeBlueprint = {
      ...existingBlueprint,
      fiveYearGoals: formData.goals.split('\n').filter(g => g.trim()),
      priorityAreas: formData.priorities,
      budgetRange: formData.budget,
      timeline: formData.timeline,
      updatedAt: new Date().toISOString(),
    };

    const historyEntry: Omit<BlueprintHistoryEntry, 'id' | 'timestamp'> = {
      action: 'updated',
      description: `${currentUser.name} updated blueprint goals and priorities`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
    };

    const notification = {
      blueprintId: existingBlueprint.id,
      propertyId: property.id,
      type: (currentUser.role === 'tech' ? 'tech_update' : 'user_update') as 'tech_update' | 'user_update',
      message: `${currentUser.name} updated the blueprint`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      recipientRole: (currentUser.role === 'tech' ? 'homeowner' : 'tech') as 'tech' | 'homeowner',
    };

    try {
      await updateBlueprint(property.id, updatedBlueprint, historyEntry, notification);
      Alert.alert('Success', 'Blueprint updated successfully');
      setMode('view');
    } catch (error) {
      console.error('[Blueprint] Failed to update blueprint:', error);
      Alert.alert('Error', 'Failed to update blueprint. Please try again.');
    }
  };

  const handleAddProject = async () => {
    if (!property || !projectForm.title.trim() || !currentUser) {
      Alert.alert('Required', 'Please enter a project title');
      return;
    }

    const project: CustomProject = {
      id: `project-${Date.now()}`,
      title: projectForm.title,
      description: projectForm.description,
      priority: projectForm.priority,
      estimatedCost: projectForm.estimatedCost,
      targetDate: projectForm.targetDate,
      status: 'planned',
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      createdByRole: currentUser.role,
      notes: projectForm.notes,
    };

    try {
      await addCustomProject(property.id, project, currentUser.id, currentUser.name, currentUser.role);
      setShowProjectModal(false);
      setProjectForm({ title: '', description: '', priority: 'medium', estimatedCost: '', targetDate: '', notes: '' });
      Alert.alert('Success', 'Project added to your blueprint');
    } catch {
      Alert.alert('Error', 'Failed to add project');
    }
  };

  const handleUpdateProject = async () => {
    if (!property || !editingProject || !currentUser) return;

    try {
      await updateCustomProject(property.id, editingProject.id, {
        title: projectForm.title,
        description: projectForm.description,
        priority: projectForm.priority,
        estimatedCost: projectForm.estimatedCost,
        targetDate: projectForm.targetDate,
        notes: projectForm.notes,
      }, currentUser.id, currentUser.name, currentUser.role);
      setShowProjectModal(false);
      setEditingProject(null);
      setProjectForm({ title: '', description: '', priority: 'medium', estimatedCost: '', targetDate: '', notes: '' });
      Alert.alert('Success', 'Project updated');
    } catch {
      Alert.alert('Error', 'Failed to update project');
    }
  };

  const handleCompleteProject = async (projectId: string) => {
    if (!property || !currentUser) return;

    Alert.alert(
      'Complete Project',
      'Mark this project as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            await updateCustomProject(property.id, projectId, {
              status: 'completed',
              completedDate: new Date().toISOString(),
            }, currentUser.id, currentUser.name, currentUser.role);
            Alert.alert('Success', 'Project marked as completed');
          },
        },
      ]
    );
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!property || !currentUser) return;

    Alert.alert(
      'Delete Project',
      'Are you sure you want to remove this project?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeCustomProject(property.id, projectId, currentUser.id, currentUser.name, currentUser.role);
            Alert.alert('Success', 'Project removed');
          },
        },
      ]
    );
  };

  const handleAddRequest = async () => {
    if (!property || !requestForm.title.trim()) {
      Alert.alert('Required', 'Please enter a request title');
      return;
    }

    const currentRequests = existingBlueprint?.monthlyVisitRequests?.length || 0;
    if (currentRequests >= 5) {
      Alert.alert('Limit Reached', 'You can only have up to 5 monthly visit requests');
      return;
    }

    const request: MonthlyVisitRequest = {
      id: `request-${Date.now()}`,
      title: requestForm.title,
      description: requestForm.description,
      priority: requestForm.priority,
      estimatedTime: requestForm.estimatedTime,
      createdAt: new Date().toISOString(),
    };

    try {
      await addMonthlyVisitRequest(property.id, request);
      setShowRequestModal(false);
      setRequestForm({ title: '', description: '', priority: 'medium', estimatedTime: '' });
      Alert.alert('Success', 'Request added for next monthly visit');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add request');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!property) return;

    Alert.alert(
      'Remove Request',
      'Are you sure you want to remove this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeMonthlyVisitRequest(property.id, requestId);
            Alert.alert('Success', 'Request removed');
          },
        },
      ]
    );
  };

  const togglePriority = (priority: string) => {
    setFormData(prev => ({
      ...prev,
      priorities: prev.priorities.includes(priority)
        ? prev.priorities.filter(p => p !== priority)
        : [...prev.priorities, priority],
    }));
  };

  const openEditProject = (project: CustomProject) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      priority: project.priority,
      estimatedCost: project.estimatedCost || '',
      targetDate: project.targetDate || '',
      notes: project.notes || '',
    });
    setShowProjectModal(true);
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
    }
  };

  const getActionIcon = (action: BlueprintHistoryEntry['action']) => {
    switch (action) {
      case 'created': return <Icons.FileText size={16} color={COLORS.teal} />;
      case 'updated': return <Icons.Edit2 size={16} color="#F59E0B" />;
      case 'project_added': return <Icons.Plus size={16} color="#10B981" />;
      case 'project_updated': return <Icons.Edit size={16} color="#3B82F6" />;
      case 'project_completed': return <Icons.CheckCircle size={16} color="#10B981" />;
      case 'plan_item_added': return <Icons.Calendar size={16} color="#8B5CF6" />;
      case 'plan_item_updated': return <Icons.CalendarCheck size={16} color="#3B82F6" />;
      case 'plan_item_completed': return <Icons.CheckCircle2 size={16} color="#10B981" />;
      default: return <Icons.Circle size={16} color="#6B7280" />;
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    if (!property) return;
    await markNotificationAsRead(property.id, notificationId);
  };

  if (mode === 'history' && existingBlueprint) {
    const sortedHistory = [...(existingBlueprint.history || [])].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Blueprint History',
            headerStyle: { backgroundColor: COLORS.teal },
            headerTintColor: COLORS.cream,
            headerTitleStyle: { fontWeight: '600', fontSize: 17 },
            headerLeft: () => (
              <TouchableOpacity onPress={() => setMode('view')} style={{ marginLeft: 8 }}>
                <Icons.ChevronLeft size={24} color="white" />
              </TouchableOpacity>
            ),
          }}
        />
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.historyHeader}>
            <Icons.History size={32} color={COLORS.teal} />
            <Text style={styles.historyTitle}>Complete History</Text>
            <Text style={styles.historySubtitle}>
              All changes and updates to your blueprint
            </Text>
          </View>

          <View style={styles.timelineContainer}>
            {sortedHistory.map((entry, index) => (
              <View key={entry.id} style={styles.timelineItem}>
                <View style={styles.timelineDot}>
                  {getActionIcon(entry.action)}
                </View>
                {index < sortedHistory.length - 1 && <View style={styles.timelineLine} />}
                
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineDescription}>{entry.description}</Text>
                    <Text style={styles.timelineDate}>
                      {new Date(entry.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.timelineMeta}>
                    <View style={[styles.roleBadge, { backgroundColor: entry.userRole === 'tech' ? '#DBEAFE' : '#FEF3C7' }]}>
                      <Text style={[styles.roleBadgeText, { color: entry.userRole === 'tech' ? '#1E40AF' : '#92400E' }]}>
                        {entry.userRole === 'tech' ? 'Tech' : entry.userRole === 'admin' ? 'Admin' : 'Homeowner'}
                      </Text>
                    </View>
                    <Text style={styles.timelineTime}>
                      {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  {entry.changes && entry.changes.length > 0 && (
                    <View style={styles.changesContainer}>
                      {entry.changes.map((change, idx) => (
                        <View key={idx} style={styles.changeItem}>
                          <Text style={styles.changeField}>{change.field}:</Text>
                          <Text style={styles.changeValue}>
                            {change.oldValue ? `${change.oldValue} → ` : ''}{change.newValue}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (mode === 'view' && existingBlueprint) {
    const recentHistory = [...(existingBlueprint.history || [])]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'MyHome Blueprint',
            headerStyle: { backgroundColor: COLORS.teal },
            headerTintColor: COLORS.cream,
            headerTitleStyle: { fontWeight: '600', fontSize: 17 },
            headerRight: () => (
              <View style={{ flexDirection: 'row', gap: 12, marginRight: 8 }}>
                <TouchableOpacity onPress={() => setShowNotifications(true)} style={{ position: 'relative' }}>
                  <Icons.Bell size={20} color="white" />
                  {unreadNotifications.length > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>{unreadNotifications.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMode('edit')}>
                  <Icons.Edit2 size={20} color="white" />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.viewHeader}>
            <Icons.FileText size={40} color="#D4AF37" />
            <Text style={styles.viewTitle}>Your Home Care Plan</Text>
            <Text style={styles.viewSubtitle}>
              Last updated {new Date(existingBlueprint.updatedAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.viewSection}>
            <Text style={styles.viewSectionTitle}>5-Year Goals</Text>
            {existingBlueprint.fiveYearGoals.map((goal, idx) => (
              <View key={idx} style={styles.goalItem}>
                <Icons.Target size={16} color="#0D9488" />
                <Text style={styles.goalText}>{goal}</Text>
              </View>
            ))}
          </View>

          <View style={styles.viewSection}>
            <Text style={styles.viewSectionTitle}>Priority Areas</Text>
            <View style={styles.tagsContainer}>
              {existingBlueprint.priorityAreas.map((area, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>

          {existingBlueprint.budgetRange && (
            <View style={styles.viewSection}>
              <Text style={styles.viewSectionTitle}>Annual Budget</Text>
              <Text style={styles.infoText}>{existingBlueprint.budgetRange}</Text>
            </View>
          )}

          <View style={styles.viewSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.viewSectionTitle}>Custom Projects</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setEditingProject(null);
                  setProjectForm({ title: '', description: '', priority: 'medium', estimatedCost: '', targetDate: '', notes: '' });
                  setShowProjectModal(true);
                }}
              >
                <Icons.Plus size={18} color="white" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            {(!existingBlueprint.customProjects || existingBlueprint.customProjects.length === 0) ? (
              <Text style={styles.emptyText}>No custom projects yet</Text>
            ) : (
              existingBlueprint.customProjects?.map((project) => (
                <View key={project.id} style={[
                  styles.projectCard,
                  project.status === 'completed' && styles.projectCardCompleted
                ]}>
                  <View style={styles.projectHeader}>
                    <View style={styles.projectTitleRow}>
                      {project.status === 'completed' && (
                        <Icons.CheckCircle size={20} color="#10B981" />
                      )}
                      <Text style={[
                        styles.projectTitle,
                        project.status === 'completed' && styles.projectTitleCompleted
                      ]}>
                        {project.title}
                      </Text>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(project.priority) + '20' }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(project.priority) }]}>
                          {project.priority}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.projectActions}>
                      {project.status !== 'completed' && (
                        <TouchableOpacity onPress={() => handleCompleteProject(project.id)} style={styles.iconButton}>
                          <Icons.Check size={16} color="#10B981" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => openEditProject(project)} style={styles.iconButton}>
                        <Icons.Edit2 size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteProject(project.id)} style={styles.iconButton}>
                        <Icons.Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {project.description && (
                    <Text style={styles.projectDescription}>{project.description}</Text>
                  )}
                  <View style={styles.projectMeta}>
                    {project.estimatedCost && (
                      <View style={styles.metaItem}>
                        <Icons.DollarSign size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{project.estimatedCost}</Text>
                      </View>
                    )}
                    {project.targetDate && (
                      <View style={styles.metaItem}>
                        <Icons.Calendar size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{project.targetDate}</Text>
                      </View>
                    )}
                    {project.createdByRole && (
                      <View style={styles.metaItem}>
                        <Icons.User size={14} color="#6B7280" />
                        <Text style={styles.metaText}>
                          {project.createdByRole === 'tech' ? 'Tech' : 'Homeowner'}
                        </Text>
                      </View>
                    )}
                  </View>
                  {project.completedDate && (
                    <Text style={styles.completedDate}>
                      Completed {new Date(project.completedDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.viewSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.viewSectionTitle}>Monthly Visit Requests</Text>
                <Text style={styles.requestLimit}>
                  {existingBlueprint.monthlyVisitRequests?.length || 0}/5 requests
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  (existingBlueprint.monthlyVisitRequests?.length || 0) >= 5 && styles.addButtonDisabled
                ]}
                onPress={() => setShowRequestModal(true)}
                disabled={(existingBlueprint.monthlyVisitRequests?.length || 0) >= 5}
              >
                <Icons.Plus size={18} color="white" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            {(!existingBlueprint.monthlyVisitRequests || existingBlueprint.monthlyVisitRequests.length === 0) ? (
              <Text style={styles.emptyText}>No monthly visit requests yet</Text>
            ) : (
              existingBlueprint.monthlyVisitRequests?.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestTitleRow}>
                      <Text style={styles.requestTitle}>{request.title}</Text>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) + '20' }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(request.priority) }]}>
                          {request.priority}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteRequest(request.id)} style={styles.iconButton}>
                      <Icons.X size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  {request.description && (
                    <Text style={styles.requestDescription}>{request.description}</Text>
                  )}
                  {request.estimatedTime && (
                    <View style={styles.requestMeta}>
                      <Icons.Clock size={14} color="#6B7280" />
                      <Text style={styles.metaText}>{request.estimatedTime}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.viewSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.viewSectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => setMode('history')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.activityList}>
              {recentHistory.map((entry, index) => (
                <View key={entry.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    {getActionIcon(entry.action)}
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityDescription}>{entry.description}</Text>
                    <Text style={styles.activityTime}>
                      {new Date(entry.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <Icons.Info size={16} color="#6B7280" />
            <Text style={styles.footerText}>
              Your Hudson director reviews your blueprint regularly to customize your monthly maintenance visits.
            </Text>
          </View>
        </ScrollView>

        <Modal
          visible={showProjectModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingProject ? 'Edit Project' : 'Add Custom Project'}
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowProjectModal(false);
                  setEditingProject(null);
                }}>
                  <Icons.X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <Text style={styles.inputLabel}>Project Title *</Text>
                <TextInput
                  style={styles.input}
                  value={projectForm.title}
                  onChangeText={(text) => setProjectForm(prev => ({ ...prev, title: text }))}
                  placeholder="e.g., Kitchen Remodel"
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={projectForm.description}
                  onChangeText={(text) => setProjectForm(prev => ({ ...prev, description: text }))}
                  placeholder="Describe the project..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.priorityButtons}>
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        projectForm.priority === p && { backgroundColor: getPriorityColor(p) + '20', borderColor: getPriorityColor(p) }
                      ]}
                      onPress={() => setProjectForm(prev => ({ ...prev, priority: p }))}
                    >
                      <Text style={[
                        styles.priorityButtonText,
                        projectForm.priority === p && { color: getPriorityColor(p), fontWeight: '600' }
                      ]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Estimated Cost</Text>
                <TextInput
                  style={styles.input}
                  value={projectForm.estimatedCost}
                  onChangeText={(text) => setProjectForm(prev => ({ ...prev, estimatedCost: text }))}
                  placeholder="e.g., $10,000 - $15,000"
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.inputLabel}>Target Date</Text>
                <TextInput
                  style={styles.input}
                  value={projectForm.targetDate}
                  onChangeText={(text) => setProjectForm(prev => ({ ...prev, targetDate: text }))}
                  placeholder="e.g., Summer 2025"
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={projectForm.notes}
                  onChangeText={(text) => setProjectForm(prev => ({ ...prev, notes: text }))}
                  placeholder="Additional notes..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={editingProject ? handleUpdateProject : handleAddProject}
              >
                <Text style={styles.modalButtonText}>
                  {editingProject ? 'Update Project' : 'Add Project'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showRequestModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowRequestModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Monthly Visit Request</Text>
                <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                  <Icons.X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <Text style={styles.inputLabel}>Request Title *</Text>
                <TextInput
                  style={styles.input}
                  value={requestForm.title}
                  onChangeText={(text) => setRequestForm(prev => ({ ...prev, title: text }))}
                  placeholder="e.g., Check basement for moisture"
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={requestForm.description}
                  onChangeText={(text) => setRequestForm(prev => ({ ...prev, description: text }))}
                  placeholder="Provide details..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.priorityButtons}>
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        requestForm.priority === p && { backgroundColor: getPriorityColor(p) + '20', borderColor: getPriorityColor(p) }
                      ]}
                      onPress={() => setRequestForm(prev => ({ ...prev, priority: p }))}
                    >
                      <Text style={[
                        styles.priorityButtonText,
                        requestForm.priority === p && { color: getPriorityColor(p), fontWeight: '600' }
                      ]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Estimated Time</Text>
                <TextInput
                  style={styles.input}
                  value={requestForm.estimatedTime}
                  onChangeText={(text) => setRequestForm(prev => ({ ...prev, estimatedTime: text }))}
                  placeholder="e.g., 30 minutes"
                  placeholderTextColor="#9CA3AF"
                />

                <View style={styles.infoBox}>
                  <Icons.Info size={16} color="#0D9488" />
                  <Text style={styles.infoBoxText}>
                    You can add up to 5 requests for your monthly Hudson visit. Time permitting, your Hudson will address these during their visit.
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.modalButton} onPress={handleAddRequest}>
                <Text style={styles.modalButtonText}>Add Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showNotifications}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNotifications(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notifications</Text>
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <Icons.X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {unreadNotifications.length === 0 ? (
                  <View style={styles.emptyNotifications}>
                    <Icons.Bell size={48} color="#D1D5DB" />
                    <Text style={styles.emptyNotificationsText}>No new notifications</Text>
                  </View>
                ) : (
                  unreadNotifications.map((notif) => (
                    <TouchableOpacity
                      key={notif.id}
                      style={styles.notificationItem}
                      onPress={() => handleMarkNotificationRead(notif.id)}
                    >
                      <View style={styles.notificationIcon}>
                        {notif.type === 'project_completed' && <Icons.CheckCircle size={20} color="#10B981" />}
                        {notif.type === 'project_added' && <Icons.Plus size={20} color="#3B82F6" />}
                        {notif.type === 'user_update' && <Icons.User size={20} color="#F59E0B" />}
                        {notif.type === 'tech_update' && <Icons.Wrench size={20} color="#8B5CF6" />}
                        {notif.type === 'plan_modified' && <Icons.Calendar size={20} color="#EC4899" />}
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationMessage}>{notif.message}</Text>
                        <Text style={styles.notificationTime}>
                          {new Date(notif.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: mode === 'edit' ? 'Edit Blueprint' : 'Create Blueprint',
          headerStyle: { backgroundColor: COLORS.teal },
          headerTintColor: COLORS.cream,
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
          headerLeft: mode === 'edit' ? () => (
            <TouchableOpacity onPress={() => {
              setMode('view');
            }} style={{ marginLeft: 8 }}>
              <Icons.X size={24} color="white" />
            </TouchableOpacity>
          ) : () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <Icons.ChevronLeft size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Icons.FileText size={48} color="#D4AF37" />
          <Text style={styles.title}>
            {mode === 'edit' ? 'Update Your Plan' : 'Create Your 5-Year Plan'}
          </Text>
          <Text style={styles.subtitle}>
            Help us understand your home improvement goals for personalized maintenance.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>What are your top 5-year home improvement goals?</Text>
          <Text style={styles.hint}>Enter each goal on a new line</Text>
          <TextInput
            style={styles.textAreaInput}
            multiline
            numberOfLines={6}
            value={formData.goals}
            onChangeText={(text) => setFormData(prev => ({ ...prev, goals: text }))}
            placeholder="e.g., Kitchen remodel&#10;New deck&#10;Energy efficiency upgrades"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Which areas need the most attention?</Text>
          <Text style={styles.hint}>Select all that apply</Text>
          <View style={styles.checklistContainer}>
            {[
              'Kitchen',
              'Bathrooms',
              'Outdoor Spaces',
              'HVAC System',
              'Roof',
              'Windows & Doors',
              'Flooring',
              'Landscaping',
              'Energy Efficiency',
              'Smart Home',
            ].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.checklistItem,
                  formData.priorities.includes(option) && styles.checklistItemActive,
                ]}
                onPress={() => togglePriority(option)}
              >
                <View style={[
                  styles.checkbox,
                  formData.priorities.includes(option) && styles.checkboxActive,
                ]}>
                  {formData.priorities.includes(option) && (
                    <Icons.Check size={16} color="white" strokeWidth={3} />
                  )}
                </View>
                <Text style={[
                  styles.checklistText,
                  formData.priorities.includes(option) && styles.checklistTextActive,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>What is your annual home improvement budget?</Text>
          <View style={styles.radioContainer}>
            {[
              'Under $5,000',
              '$5,000 - $15,000',
              '$15,000 - $30,000',
              '$30,000 - $50,000',
              'Over $50,000',
            ].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.radioItem,
                  formData.budget === option && styles.radioItemActive,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, budget: option }))}
              >
                <View style={[
                  styles.radio,
                  formData.budget === option && styles.radioActive,
                ]}>
                  {formData.budget === option && (
                    <View style={styles.radioDot} />
                  )}
                </View>
                <Text style={[
                  styles.radioText,
                  formData.budget === option && styles.radioTextActive,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>When would you like to start major projects?</Text>
          <View style={styles.radioContainer}>
            {[
              'Within 3 months',
              '3-6 months',
              '6-12 months',
              '1-2 years',
              '2+ years',
            ].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.radioItem,
                  formData.timeline === option && styles.radioItemActive,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, timeline: option }))}
              >
                <View style={[
                  styles.radio,
                  formData.timeline === option && styles.radioActive,
                ]}>
                  {formData.timeline === option && (
                    <View style={styles.radioDot} />
                  )}
                </View>
                <Text style={[
                  styles.radioText,
                  formData.timeline === option && styles.radioTextActive,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={mode === 'edit' ? handleUpdateBlueprint : handleCreateBlueprint}
        >
          <Text style={styles.submitButtonText}>
            {mode === 'edit' ? 'Update Blueprint' : 'Create Blueprint'}
          </Text>
          <Icons.ArrowRight size={20} color="white" />
        </TouchableOpacity>

        <View style={styles.footer}>
          <Icons.Info size={16} color="#6B7280" />
          <Text style={styles.footerText}>
            Your blueprint will be reviewed by your personal Hudson director and used to customize your monthly maintenance visits.
          </Text>
        </View>
      </ScrollView>
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
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.teal,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  viewHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
  },
  viewTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#111827',
    marginTop: 12,
  },
  viewSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  viewSection: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 12,
  },
  viewSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  goalText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: COLORS.teal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: COLORS.teal,
    fontWeight: '600' as const,
  },
  infoText: {
    fontSize: 16,
    color: '#374151',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.teal,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  projectCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  projectCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    flex: 1,
  },
  projectTitleCompleted: {
    color: '#059669',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  projectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  projectMeta: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  completedDate: {
    fontSize: 12,
    color: '#059669',
    marginTop: 8,
    fontWeight: '600' as const,
  },
  requestLimit: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  requestCard: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    flex: 1,
  },
  requestDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  section: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  textAreaInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  checklistContainer: {
    gap: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  checklistItemActive: {
    borderColor: COLORS.teal,
    backgroundColor: '#F0FDFA',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  checklistText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500' as const,
  },
  checklistTextActive: {
    color: COLORS.teal,
    fontWeight: '600' as const,
  },
  radioContainer: {
    gap: 12,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  radioItemActive: {
    borderColor: COLORS.teal,
    backgroundColor: '#F0FDFA',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioActive: {
    borderColor: COLORS.teal,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.teal,
  },
  radioText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500' as const,
  },
  radioTextActive: {
    color: COLORS.teal,
    fontWeight: '600' as const,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'white',
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
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F0FDFA',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.teal,
    lineHeight: 18,
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
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.teal,
    fontWeight: '600' as const,
  },
  historyHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#111827',
    marginTop: 12,
  },
  historySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  timelineContainer: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 12,
  },
  timelineItem: {
    position: 'relative',
    paddingLeft: 40,
    paddingBottom: 24,
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: 0,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  timelineDescription: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500' as const,
    marginRight: 8,
  },
  timelineDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  timelineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  timelineTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  changesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  changeItem: {
    marginBottom: 4,
  },
  changeField: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600' as const,
  },
  changeValue: {
    fontSize: 12,
    color: '#374151',
    marginTop: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  emptyNotifications: {
    alignItems: 'center',
    padding: 40,
  },
  emptyNotificationsText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
});
