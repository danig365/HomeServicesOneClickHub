import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { SnapshotInspection, RoomInspection } from '@/types/tech-appointment';

const STORAGE_KEY = 'hudson_snapshots';

export const [SnapshotProvider, useSnapshots] = createContextHook(() => {
  const [snapshots, setSnapshots] = useState<SnapshotInspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSnapshots = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSnapshots(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load snapshots:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  const saveSnapshots = useCallback(async (newSnapshots: SnapshotInspection[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSnapshots));
      setSnapshots(newSnapshots);
    } catch (error) {
      console.error('Failed to save snapshots:', error);
    }
  }, []);

  const createSnapshot = useCallback(async (
    techId: string,
    propertyId?: string
  ) => {
    const newSnapshot: SnapshotInspection = {
      id: `snapshot-${Date.now()}`,
      propertyId: propertyId || undefined,
      appointmentId: '',
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

    await saveSnapshots([...snapshots, newSnapshot]);
    return newSnapshot;
  }, [snapshots, saveSnapshots]);

  const updateSnapshot = useCallback(async (id: string, updates: Partial<SnapshotInspection>) => {
    const updatedSnapshots = snapshots.map(snap =>
      snap.id === id ? { ...snap, ...updates } : snap
    );
    await saveSnapshots(updatedSnapshots);
  }, [snapshots, saveSnapshots]);

  const assignSnapshotToProperty = useCallback(async (snapshotId: string, propertyId: string) => {
    await updateSnapshot(snapshotId, { propertyId });
  }, [updateSnapshot]);

  const addRoomInspection = useCallback(async (snapshotId: string, room: Omit<RoomInspection, 'id'>) => {
    const snapshot = snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return;

    const newRoom: RoomInspection = {
      ...room,
      id: `room-${Date.now()}`,
    };

    const updatedRooms = [...snapshot.rooms, newRoom];
    const avgScore = updatedRooms.reduce((sum, r) => sum + r.score, 0) / updatedRooms.length;

    await updateSnapshot(snapshotId, {
      rooms: updatedRooms,
      overallScore: Math.round(avgScore),
    });
  }, [snapshots, updateSnapshot]);

  const updateRoomInspection = useCallback(async (snapshotId: string, roomId: string, updates: Partial<RoomInspection>) => {
    const snapshot = snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return;

    const updatedRooms = snapshot.rooms.map(room =>
      room.id === roomId ? { ...room, ...updates } : room
    );

    const avgScore = updatedRooms.reduce((sum, r) => sum + r.score, 0) / updatedRooms.length;

    await updateSnapshot(snapshotId, {
      rooms: updatedRooms,
      overallScore: Math.round(avgScore),
    });
  }, [snapshots, updateSnapshot]);

  const updateSnapshotScores = useCallback(async (
    snapshotId: string,
    scores: {
      structuralScore: number;
      mechanicalScore: number;
      aestheticScore: number;
      efficiencyScore: number;
      safetyScore: number;
    }
  ) => {
    const overallScore = Math.round(
      (scores.structuralScore + scores.mechanicalScore + scores.aestheticScore + scores.efficiencyScore + scores.safetyScore) / 5
    );

    await updateSnapshot(snapshotId, {
      ...scores,
      overallScore,
    });
  }, [updateSnapshot]);

  const completeSnapshot = useCallback(async (snapshotId: string) => {
    await updateSnapshot(snapshotId, {
      completedAt: new Date().toISOString(),
    });
  }, [updateSnapshot]);

  const getSnapshotsByProperty = useCallback((propertyId: string) => {
    return snapshots.filter(snap => snap.propertyId === propertyId);
  }, [snapshots]);

  const getSnapshotsByTech = useCallback((techId: string) => {
    return snapshots.filter(snap => snap.techId === techId);
  }, [snapshots]);

  const getUnassignedSnapshots = useCallback(() => {
    return snapshots.filter(snap => !snap.propertyId);
  }, [snapshots]);

  return useMemo(() => ({
    snapshots,
    isLoading,
    createSnapshot,
    updateSnapshot,
    assignSnapshotToProperty,
    addRoomInspection,
    updateRoomInspection,
    updateSnapshotScores,
    completeSnapshot,
    getSnapshotsByProperty,
    getSnapshotsByTech,
    getUnassignedSnapshots,
  }), [
    snapshots,
    isLoading,
    createSnapshot,
    updateSnapshot,
    assignSnapshotToProperty,
    addRoomInspection,
    updateRoomInspection,
    updateSnapshotScores,
    completeSnapshot,
    getSnapshotsByProperty,
    getSnapshotsByTech,
    getUnassignedSnapshots,
  ]);
});
