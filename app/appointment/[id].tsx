import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useAppointments } from '@/hooks/appointments-store';
import { COLORS } from '@/constants/colors';
import { Appointment } from '@/types/appointment';
import * as Icons from 'lucide-react-native';

export default function AppointmentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { getAppointmentById } = useAppointments();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    if (typeof id === 'string') {
      const data = await getAppointmentById(id);
      setAppointment(data);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#F0FDF4', text: '#10B981' };
      case 'cancelled':
        return { bg: '#FEF2F2', text: '#EF4444' };
      default:
        return { bg: '#DBEAFE', text: '#1E40AF' };
    }
  };

  if (loading || !appointment) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Appointment Details',
            headerStyle: { backgroundColor: COLORS.teal },
            headerTintColor: 'white',
          }}
        />
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.teal} />
        ) : (
          <Text style={styles.errorText}>Appointment not found</Text>
        )}
      </View>
    );
  }

  const statusColors = getStatusColor(appointment.status);
  const completedTasks = appointment.tasks?.filter(t => t.completed).length || 0;
  const totalTasks = appointment.tasks?.length || 0;

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Appointment Details',
          headerStyle: { backgroundColor: COLORS.teal },
          headerTintColor: 'white',
        }}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.propertyInfo}>
            <Text style={styles.title}>{appointment.propertyName}</Text>
            <Text style={styles.subtitle}>
              {appointment.type === 'snapshot-inspection' ? 'Snapshot Inspection' : 'Monthly Maintenance'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {appointment.status}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Icons.Calendar size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Scheduled Date</Text>
              <Text style={styles.infoText}>
                {formatDate(appointment.scheduledDate)} at {formatTime(appointment.scheduledDate)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icons.User size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Technician</Text>
              <Text style={styles.infoText}>{appointment.techName}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icons.MapPin size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoText}>{appointment.propertyAddress}</Text>
            </View>
          </View>

          {appointment.notes && (
            <View style={styles.infoRow}>
              <Icons.FileText size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={styles.infoText}>{appointment.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {appointment.tasks && appointment.tasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tasks ({completedTasks}/{totalTasks})</Text>
            {appointment.tasks.map(task => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskName}>{task.name}</Text>
                  {task.completed ? (
                    <Icons.CheckCircle size={20} color="#10B981" />
                  ) : (
                    <Icons.Circle size={20} color="#6B7280" />
                  )}
                </View>
                <Text style={styles.taskDescription}>{task.description}</Text>
                <Text style={styles.taskMeta}>
                  {task.category} • {task.estimatedDuration}
                </Text>
              </View>
            ))}
          </View>
        )}

        {appointment.nextVisitDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Visit</Text>
            <Text style={styles.nextVisitDate}>
              {formatDate(appointment.nextVisitDate)}
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
    backgroundColor: COLORS.cream,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  propertyInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'white',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 16,
    color: '#111827',
  },
  taskItem: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    gap: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  taskDescription: {
    fontSize: 14,
    color: '#4B5563',
  },
  taskMeta: {
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  nextVisitDate: {
    fontSize: 16,
    color: '#111827',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
});