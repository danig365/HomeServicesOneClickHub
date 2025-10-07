import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useProperties } from '@/hooks/properties-store';
import { useTechAppointments } from '@/hooks/tech-appointments-store';
import { COLORS } from '@/constants/colors';
import { MaintenanceTask } from '@/types/tech-appointment';

export default function AppointmentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { properties } = useProperties();
  const { 
    appointments, 
    updateAppointment, 
    updateAppointmentStatus, 
    completeTask,
    addMediaNote 
  } = useTechAppointments();

  const [notes, setNotes] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const appointment = appointments.find(a => a.id === id);
  const property = appointment ? properties.find(p => p.id === appointment.propertyId) : null;

  if (!appointment || !property) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Appointment not found</Text>
      </View>
    );
  }

  const completedTasks = appointment.tasks.filter(t => t.completed).length;
  const totalTasks = appointment.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleStartAppointment = async () => {
    await updateAppointmentStatus(appointment.id, 'in-progress');
    Alert.alert('Success', 'Appointment started');
  };

  const handleCompleteAppointment = async () => {
    if (appointment.type === 'snapshot' && !appointment.snapshotInspection?.completedAt) {
      Alert.alert('Error', 'Please complete the snapshot inspection first');
      return;
    }

    if (completedTasks < totalTasks) {
      Alert.alert(
        'Incomplete Tasks',
        `${totalTasks - completedTasks} tasks remaining. Complete anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete',
            onPress: async () => {
              await updateAppointmentStatus(appointment.id, 'completed');
              Alert.alert('Success', 'Appointment completed');
              router.back();
            },
          },
        ]
      );
    } else {
      await updateAppointmentStatus(appointment.id, 'completed');
      Alert.alert('Success', 'Appointment completed');
      router.back();
    }
  };

  const handleToggleTask = async (task: MaintenanceTask) => {
    await completeTask(appointment.id, task.id);
  };

  const handleSaveNotes = async () => {
    await updateAppointment(appointment.id, { notes });
    Alert.alert('Success', 'Notes saved');
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      await addMediaNote(appointment.id, 'image', result.assets[0].uri);
      Alert.alert('Success', 'Photo added');
    }
  };

  const handleStartRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not Supported', 'Audio recording is not supported on web');
        return;
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone permission is required');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      
      const uri = recording.getURI();
      if (uri) {
        await addMediaNote(appointment.id, 'audio', uri);
        Alert.alert('Success', 'Audio note saved');
      }

      setRecording(null);
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save audio note');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{ 
          title: property.name,
          headerStyle: { backgroundColor: COLORS.teal },
          headerTintColor: COLORS.gold,
        }} 
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.propertyName}>{property.name}</Text>
              <Text style={styles.propertyAddress}>{property.address}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: appointment.status === 'completed' ? '#F0FDF4' : appointment.status === 'in-progress' ? '#FEF3C7' : '#DBEAFE' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: appointment.status === 'completed' ? '#10B981' : appointment.status === 'in-progress' ? '#B45309' : '#1E40AF' }
              ]}>
                {appointment.status === 'completed' ? 'Completed' : appointment.status === 'in-progress' ? 'In Progress' : 'Scheduled'}
              </Text>
            </View>
          </View>

          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDate(appointment.scheduledDate)}</Text>
              <Text style={styles.statLabel}>Scheduled</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{appointment.type === 'snapshot' ? 'Snapshot' : 'Standard'}</Text>
              <Text style={styles.statLabel}>Type</Text>
            </View>
            {appointment.type === 'standard' && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{completedTasks}/{totalTasks}</Text>
                  <Text style={styles.statLabel}>Tasks</Text>
                </View>
              </>
            )}
          </View>

          {appointment.type === 'standard' && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          )}
        </View>

        {appointment.status === 'scheduled' && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.startButton} onPress={handleStartAppointment}>
              <Icons.Play size={20} color="white" />
              <Text style={styles.startButtonText}>Start Appointment</Text>
            </TouchableOpacity>
          </View>
        )}

        {appointment.type === 'snapshot' ? (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.snapshotButton}
              onPress={() => router.push(`/snapshot-inspection/${appointment.id}` as any)}
            >
              <Icons.Camera size={24} color="white" />
              <Text style={styles.snapshotButtonText}>
                {appointment.snapshotInspection?.completedAt ? 'View Snapshot Inspection' : 'Start Snapshot Inspection'}
              </Text>
              <Icons.ChevronRight size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maintenance Tasks</Text>
            {appointment.tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
                onPress={() => handleToggleTask(task)}
              >
                <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                  {task.completed && <Icons.Check size={18} color="white" />}
                </View>
                <View style={styles.taskDetails}>
                  <Text style={[styles.taskName, task.completed && styles.taskNameCompleted]}>
                    {task.name}
                  </Text>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                  <View style={styles.taskMeta}>
                    <Icons.Clock size={14} color="#9CA3AF" />
                    <Text style={styles.taskMetaText}>{task.estimatedDuration}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Media & Notes</Text>
          
          <View style={styles.mediaButtons}>
            <TouchableOpacity style={styles.mediaButton} onPress={handleTakePhoto}>
              <Icons.Camera size={20} color={COLORS.teal} />
              <Text style={styles.mediaButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={[styles.mediaButton, isRecording && styles.mediaButtonRecording]}
                onPress={isRecording ? handleStopRecording : handleStartRecording}
              >
                <Icons.Mic size={20} color={isRecording ? 'white' : COLORS.teal} />
                <Text style={[styles.mediaButtonText, isRecording && styles.mediaButtonTextRecording]}>
                  {isRecording ? 'Stop Recording' : 'Record Audio'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {appointment.images.length > 0 && (
            <View style={styles.mediaList}>
              <Text style={styles.mediaListTitle}>Photos ({appointment.images.length})</Text>
              {appointment.images.map((img) => (
                <View key={img.id} style={styles.mediaItem}>
                  <Icons.Image size={16} color={COLORS.teal} />
                  <Text style={styles.mediaItemText}>
                    {new Date(img.timestamp).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {appointment.audioNotes.length > 0 && (
            <View style={styles.mediaList}>
              <Text style={styles.mediaListTitle}>Audio Notes ({appointment.audioNotes.length})</Text>
              {appointment.audioNotes.map((audio) => (
                <View key={audio.id} style={styles.mediaItem}>
                  <Icons.Mic size={16} color={COLORS.teal} />
                  <Text style={styles.mediaItemText}>
                    {new Date(audio.timestamp).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TextInput
            style={styles.notesInput}
            placeholder="Add appointment notes..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            value={notes || appointment.notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveNotes}>
            <Icons.Save size={20} color="white" />
            <Text style={styles.saveButtonText}>Save Notes</Text>
          </TouchableOpacity>
        </View>

        {appointment.status === 'in-progress' && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.completeButton} onPress={handleCompleteAppointment}>
              <Icons.CheckCircle size={24} color="white" />
              <Text style={styles.completeButtonText}>Complete Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
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
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
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
    marginBottom: 20,
  },
  propertyName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#111827',
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
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.teal,
    borderRadius: 6,
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.teal,
    padding: 16,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'white',
  },
  snapshotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F59E0B',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  snapshotButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'white',
    flex: 1,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardCompleted: {
    backgroundColor: '#F9FAFB',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  taskDetails: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  taskNameCompleted: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.teal,
  },
  mediaButtonRecording: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  mediaButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.teal,
  },
  mediaButtonTextRecording: {
    color: 'white',
  },
  mediaList: {
    marginBottom: 16,
  },
  mediaListTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 8,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 6,
  },
  mediaItemText: {
    fontSize: 13,
    color: '#6B7280',
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 120,
    marginBottom: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.teal,
    padding: 14,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'white',
  },
});
