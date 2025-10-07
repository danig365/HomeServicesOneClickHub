import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { TechAppointment, MaintenanceTask, MediaNote, RoomInspection, AppointmentStatus } from '@/types/tech-appointment';
import { getMonthlyTasks } from '@/constants/maintenance-tasks';

const STORAGE_KEY = 'hudson_tech_appointments';

export const [TechAppointmentsProvider, useTechAppointments] = createContextHook(() => {
  const [appointments, setAppointments] = useState<TechAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAppointments = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAppointments(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const saveAppointments = useCallback(async (newAppointments: TechAppointment[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newAppointments));
      setAppointments(newAppointments);
    } catch (error) {
      console.error('Failed to save appointments:', error);
    }
  }, []);

  const createAppointment = useCallback(async (
    propertyId: string,
    techId: string,
    type: 'standard' | 'snapshot',
    scheduledDate: string,
    userRequests?: string[]
  ) => {
    const month = new Date(scheduledDate).getMonth() + 1;
    const monthlyTasks = getMonthlyTasks(month);

    const tasks: MaintenanceTask[] = monthlyTasks.map((task, index) => ({
      id: `task-${Date.now()}-${index}`,
      ...task,
      completed: false,
    }));

    const newAppointment: TechAppointment = {
      id: `appointment-${Date.now()}`,
      propertyId,
      techId,
      type,
      status: 'scheduled',
      scheduledDate,
      tasks: type === 'standard' ? tasks : [],
      notes: '',
      images: [],
      audioNotes: [],
      userRequests,
    };

    if (type === 'snapshot') {
      newAppointment.snapshotInspection = {
        id: `snapshot-${Date.now()}`,
        propertyId,
        appointmentId: newAppointment.id,
        rooms: [],
        overallScore: 85,
        structuralScore: 85,
        mechanicalScore: 85,
        aestheticScore: 85,
        efficiencyScore: 85,
        safetyScore: 85,
        generalNotes: '',
        generalImages: [],
        generalAudioNotes: [],
        techId,
      };
      console.log('Created snapshot inspection:', newAppointment.snapshotInspection);
    }

    await saveAppointments([...appointments, newAppointment]);
    return newAppointment;
  }, [appointments, saveAppointments]);

  const updateAppointment = useCallback(async (id: string, updates: Partial<TechAppointment>) => {
    const updatedAppointments = appointments.map(apt =>
      apt.id === id ? { ...apt, ...updates } : apt
    );
    await saveAppointments(updatedAppointments);
  }, [appointments, saveAppointments]);

  const updateAppointmentStatus = useCallback(async (id: string, status: AppointmentStatus) => {
    const updates: Partial<TechAppointment> = { status };
    
    if (status === 'in-progress' && !appointments.find(a => a.id === id)?.startedAt) {
      updates.startedAt = new Date().toISOString();
    }
    
    if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
    }

    await updateAppointment(id, updates);
  }, [appointments, updateAppointment]);

  const completeTask = useCallback(async (appointmentId: string, taskId: string, notes?: string, images?: MediaNote[], audioNotes?: MediaNote[]) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    const updatedTasks = appointment.tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            completed: true,
            completedAt: new Date().toISOString(),
            notes: notes || task.notes,
            images: images || task.images,
            audioNotes: audioNotes || task.audioNotes,
          }
        : task
    );

    await updateAppointment(appointmentId, { tasks: updatedTasks });
  }, [appointments, updateAppointment]);

  const addMediaNote = useCallback(async (
    appointmentId: string,
    type: 'image' | 'audio',
    uri: string,
    notes?: string,
    location?: string
  ) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    const mediaNote: MediaNote = {
      id: `media-${Date.now()}`,
      type,
      uri,
      timestamp: new Date().toISOString(),
      notes,
      location,
    };

    const updates: Partial<TechAppointment> = {};
    if (type === 'image') {
      updates.images = [...appointment.images, mediaNote];
    } else {
      updates.audioNotes = [...appointment.audioNotes, mediaNote];
    }

    await updateAppointment(appointmentId, updates);
  }, [appointments, updateAppointment]);

  const addRoomInspection = useCallback(async (appointmentId: string, room: Omit<RoomInspection, 'id'>) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment?.snapshotInspection) return;

    const newRoom: RoomInspection = {
      ...room,
      id: `room-${Date.now()}`,
    };

    const updatedRooms = [...appointment.snapshotInspection.rooms, newRoom];
    const avgScore = updatedRooms.reduce((sum, r) => sum + r.score, 0) / updatedRooms.length;

    await updateAppointment(appointmentId, {
      snapshotInspection: {
        ...appointment.snapshotInspection,
        rooms: updatedRooms,
        overallScore: Math.round(avgScore),
      },
    });
  }, [appointments, updateAppointment]);

  const updateRoomInspection = useCallback(async (appointmentId: string, roomId: string, updates: Partial<RoomInspection>) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment?.snapshotInspection) return;

    const updatedRooms = appointment.snapshotInspection.rooms.map(room =>
      room.id === roomId ? { ...room, ...updates } : room
    );

    const avgScore = updatedRooms.reduce((sum, r) => sum + r.score, 0) / updatedRooms.length;

    await updateAppointment(appointmentId, {
      snapshotInspection: {
        ...appointment.snapshotInspection,
        rooms: updatedRooms,
        overallScore: Math.round(avgScore),
      },
    });
  }, [appointments, updateAppointment]);

  const updateSnapshotScores = useCallback(async (
    appointmentId: string,
    scores: {
      structuralScore: number;
      mechanicalScore: number;
      aestheticScore: number;
      efficiencyScore: number;
      safetyScore: number;
    }
  ) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment?.snapshotInspection) return;

    const overallScore = Math.round(
      (scores.structuralScore + scores.mechanicalScore + scores.aestheticScore + scores.efficiencyScore + scores.safetyScore) / 5
    );

    await updateAppointment(appointmentId, {
      snapshotInspection: {
        ...appointment.snapshotInspection,
        ...scores,
        overallScore,
      },
    });
  }, [appointments, updateAppointment]);

  const completeSnapshot = useCallback(async (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment?.snapshotInspection) return;

    await updateAppointment(appointmentId, {
      snapshotInspection: {
        ...appointment.snapshotInspection,
        completedAt: new Date().toISOString(),
      },
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  }, [appointments, updateAppointment]);

  const getAppointmentsByProperty = useCallback((propertyId: string) => {
    return appointments.filter(apt => apt.propertyId === propertyId);
  }, [appointments]);

  const getAppointmentsByTech = useCallback((techId: string) => {
    return appointments.filter(apt => apt.techId === techId);
  }, [appointments]);

  const getUpcomingAppointments = useCallback((techId?: string) => {
    const now = new Date();
    let filtered = appointments.filter(apt => 
      apt.status === 'scheduled' && new Date(apt.scheduledDate) >= now
    );
    
    if (techId) {
      filtered = filtered.filter(apt => apt.techId === techId);
    }

    return filtered.sort((a, b) => 
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
  }, [appointments]);

  const getInProgressAppointments = useCallback((techId?: string) => {
    let filtered = appointments.filter(apt => apt.status === 'in-progress');
    
    if (techId) {
      filtered = filtered.filter(apt => apt.techId === techId);
    }

    return filtered;
  }, [appointments]);

  return useMemo(() => ({
    appointments,
    isLoading,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    completeTask,
    addMediaNote,
    addRoomInspection,
    updateRoomInspection,
    updateSnapshotScores,
    completeSnapshot,
    getAppointmentsByProperty,
    getAppointmentsByTech,
    getUpcomingAppointments,
    getInProgressAppointments,
  }), [
    appointments,
    isLoading,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    completeTask,
    addMediaNote,
    addRoomInspection,
    updateRoomInspection,
    updateSnapshotScores,
    completeSnapshot,
    getAppointmentsByProperty,
    getAppointmentsByTech,
    getUpcomingAppointments,
    getInProgressAppointments,
  ]);
});
