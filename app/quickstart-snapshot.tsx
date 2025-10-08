import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Image, Modal, TextInput } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { useProperties } from '@/hooks/properties-store';
import { useSnapshots } from '@/hooks/snapshot-store';
import { useUser } from '@/hooks/user-store';
import { COLORS } from '@/constants/colors';
import { MediaNote, ApplianceDetail } from '@/types/tech-appointment';

const COMMON_ROOMS = [
  { id: 'kitchen', name: 'Kitchen', icon: 'ChefHat', color: '#F59E0B' },
  { id: 'living', name: 'Living Room', icon: 'Sofa', color: '#3B82F6' },
  { id: 'master-bedroom', name: 'Master Bedroom', icon: 'Bed', color: '#8B5CF6' },
  { id: 'bathroom-1', name: 'Main Bathroom', icon: 'Bath', color: '#10B981' },
  { id: 'bathroom-2', name: 'Guest Bathroom', icon: 'Bath', color: '#06B6D4' },
  { id: 'bedroom-2', name: 'Bedroom 2', icon: 'Bed', color: '#EC4899' },
  { id: 'bedroom-3', name: 'Bedroom 3', icon: 'Bed', color: '#F97316' },
  { id: 'garage', name: 'Garage', icon: 'Car', color: '#6B7280' },
  { id: 'exterior-front', name: 'Exterior Front', icon: 'Home', color: '#14B8A6' },
  { id: 'exterior-back', name: 'Exterior Back', icon: 'Home', color: '#0EA5E9' },
];

interface RoomProgress {
  id: string;
  name: string;
  icon: string;
  color: string;
  photos: MediaNote[];
  audioNotes: MediaNote[];
  notes: string;
  score: number;
  appliances: ApplianceDetail[];
  completed: boolean;
}

export default function QuickStartSnapshotScreen() {
  const insets = useSafeAreaInsets();
  const { propertyId } = useLocalSearchParams();
  const { properties } = useProperties();
  const { createSnapshot, addRoomInspection, updateRoomInspection, completeSnapshot } = useSnapshots();
  const { currentUser } = useUser();

  const property = properties.find(p => p.id === propertyId);

  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomProgress[]>(
    COMMON_ROOMS.map(room => ({
      ...room,
      photos: [],
      audioNotes: [],
      notes: '',
      score: 85,
      appliances: [],
      completed: false,
    }))
  );
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [overallNotes, setOverallNotes] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingInstance, setRecordingInstance] = useState<Audio.Recording | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);

  const currentRoom = rooms[currentRoomIndex];
  const totalPhotos = rooms.reduce((sum, room) => sum + room.photos.length, 0);
  const completedRooms = rooms.filter(room => room.completed).length;

  const initializeSnapshot = async () => {
    if (!currentUser?.id || !propertyId) return null;

    try {
      const snapshot = await createSnapshot(currentUser.id, propertyId as string);
      setSnapshotId(snapshot.id);
      return snapshot.id;
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      Alert.alert('Error', 'Failed to initialize snapshot');
      return null;
    }
  };

  const requestAudioPermission = async () => {
    if (Platform.OS === 'web') {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioPermission(true);
        return true;
      } catch (error) {
        console.error('Audio permission denied:', error);
        setAudioPermission(false);
        return false;
      }
    } else {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        const granted = status === 'granted';
        setAudioPermission(granted);
        return granted;
      } catch (error) {
        console.error('Failed to request audio permission:', error);
        setAudioPermission(false);
        return false;
      }
    }
  };

  const handleStartRecording = async () => {
    console.log('[QuickStart] Starting audio recording');

    if (audioPermission === null) {
      const granted = await requestAudioPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Microphone permission is required to record audio notes');
        return;
      }
    } else if (!audioPermission) {
      Alert.alert('Permission Required', 'Microphone permission is required to record audio notes');
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Audio recording is not supported on web');
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      await recording.startAsync();
      setRecordingInstance(recording);
      setIsRecording(true);
      console.log('[QuickStart] Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start audio recording');
    }
  };

  const handleStopRecording = async () => {
    if (!recordingInstance) return;

    console.log('[QuickStart] Stopping audio recording');

    try {
      await recordingInstance.stopAndUnloadAsync();
      const uri = recordingInstance.getURI();

      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }

      if (uri) {
        const newAudioNote: MediaNote = {
          id: `audio-${Date.now()}`,
          type: 'audio' as const,
          uri,
          timestamp: new Date().toISOString(),
        };

        const updatedRooms = [...rooms];
        updatedRooms[currentRoomIndex].audioNotes.push(newAudioNote);
        setRooms(updatedRooms);

        Alert.alert('Success', 'Audio note saved!');
      }

      setRecordingInstance(null);
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save audio recording');
      setIsRecording(false);
    }
  };

  const handleOpenCamera = async () => {
    console.log('[QuickStart] Opening camera, permission:', cameraPermission);

    if (!cameraPermission) {
      console.log('[QuickStart] Requesting camera permission...');
      const result = await requestCameraPermission();
      if (!result?.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }
    } else if (!cameraPermission.granted) {
      console.log('[QuickStart] Permission not granted, requesting...');
      const result = await requestCameraPermission();
      if (!result?.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }
    }

    let snapId = snapshotId;
    if (!snapId) {
      snapId = await initializeSnapshot();
      if (!snapId) return;
    }

    console.log('[QuickStart] Opening camera for room:', currentRoom.name);
    setShowCamera(true);
  };

  const handleTakePhoto = async () => {
    console.log('[QuickStart] Taking photo');

    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      console.log('[QuickStart] Photo captured:', photo);

      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
        
        setTimeout(() => {
          handleSavePhoto(photo.uri);
        }, 800);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleSavePhoto = async (photoUri: string) => {
    if (!snapshotId) {
      Alert.alert('Error', 'Snapshot not initialized');
      return;
    }

    const newPhoto: MediaNote = {
      id: `photo-${Date.now()}`,
      type: 'image' as const,
      uri: photoUri,
      timestamp: new Date().toISOString(),
    };

    const updatedRooms = [...rooms];
    updatedRooms[currentRoomIndex].photos.push(newPhoto);
    setRooms(updatedRooms);

    setCapturedPhoto(null);
    setShowCamera(false);

    Alert.alert(
      'Photo Saved!',
      `Photo added to ${currentRoom.name}. Take another photo or continue?`,
      [
        { text: 'Take Another', onPress: () => setShowCamera(true) },
        { text: 'Continue', onPress: () => {} },
      ]
    );
  };

  const handleUpdateRoomNotes = (notes: string) => {
    const updatedRooms = [...rooms];
    updatedRooms[currentRoomIndex].notes = notes;
    setRooms(updatedRooms);
  };

  const handleUpdateRoomScore = (score: number) => {
    const updatedRooms = [...rooms];
    updatedRooms[currentRoomIndex].score = score;
    setRooms(updatedRooms);
  };

  const handleAddAppliance = () => {
    const updatedRooms = [...rooms];
    const newAppliance: ApplianceDetail = {
      id: `appliance-${Date.now()}`,
      name: '',
      serialNumber: '',
      modelNumber: '',
      filterType: '',
      filterSize: '',
      notes: '',
    };
    updatedRooms[currentRoomIndex].appliances.push(newAppliance);
    setRooms(updatedRooms);
  };

  const handleUpdateAppliance = (applianceId: string, field: keyof ApplianceDetail, value: string) => {
    const updatedRooms = [...rooms];
    const appliance = updatedRooms[currentRoomIndex].appliances.find(a => a.id === applianceId);
    if (appliance) {
      (appliance as any)[field] = value;
      setRooms(updatedRooms);
    }
  };

  const handleRemoveAppliance = (applianceId: string) => {
    const updatedRooms = [...rooms];
    updatedRooms[currentRoomIndex].appliances = updatedRooms[currentRoomIndex].appliances.filter(
      a => a.id !== applianceId
    );
    setRooms(updatedRooms);
  };

  const handleMarkRoomComplete = async () => {
    if (currentRoom.photos.length === 0) {
      Alert.alert('No Photos', 'Please take at least one photo before marking as complete');
      return;
    }

    if (!snapshotId) {
      const snapId = await initializeSnapshot();
      if (!snapId) return;
    }

    const updatedRooms = [...rooms];
    updatedRooms[currentRoomIndex].completed = true;
    setRooms(updatedRooms);

    const roomData = updatedRooms[currentRoomIndex];
    await addRoomInspection(snapshotId!, {
      roomName: roomData.name,
      roomType: roomData.id.includes('bedroom') ? 'bedroom' : 
                roomData.id.includes('bathroom') ? 'bathroom' :
                roomData.id.includes('kitchen') ? 'kitchen' :
                roomData.id.includes('living') ? 'living' :
                roomData.id.includes('garage') ? 'garage' : 'other',
      score: roomData.score,
      notes: roomData.notes,
      images: roomData.photos,
      audioNotes: roomData.audioNotes,
      issues: [],
      recommendations: [],
      appliances: roomData.appliances,
    });

    handleNextRoom();
  };

  const handleSkipRoom = () => {
    Alert.alert(
      'Skip Room',
      `Skip ${currentRoom.name}? You can come back to it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: handleNextRoom },
      ]
    );
  };

  const handleNextRoom = () => {
    if (currentRoomIndex < rooms.length - 1) {
      setCurrentRoomIndex(currentRoomIndex + 1);
    } else {
      handleCompleteSnapshot();
    }
  };

  const handlePreviousRoom = () => {
    if (currentRoomIndex > 0) {
      setCurrentRoomIndex(currentRoomIndex - 1);
    }
  };

  const handleCompleteSnapshot = async () => {
    if (totalPhotos === 0) {
      Alert.alert('No Photos', 'Please take at least one photo before completing');
      return;
    }

    if (!snapshotId) {
      Alert.alert('Error', 'Snapshot not initialized');
      return;
    }

    setShowCompletionModal(true);
  };

  const handleFinalizeSnapshot = async () => {
    if (!snapshotId) return;

    try {
      await completeSnapshot(snapshotId);
      setShowCompletionModal(false);
      
      Alert.alert(
        'QuickStart Complete!',
        `Snapshot saved with ${totalPhotos} photos across ${completedRooms} rooms. The report is now available in the property blueprint.`,
        [
          { text: 'View Blueprint', onPress: () => {
            router.back();
            setTimeout(() => router.push('/blueprint' as any), 300);
          }},
          { text: 'Done', onPress: () => router.back() }
        ]
      );
    } catch (error) {
      console.error('Failed to complete snapshot:', error);
      Alert.alert('Error', 'Failed to complete snapshot');
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Home;
  };

  const IconComponent = getIconComponent(currentRoom.icon);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'QuickStart Snapshot',
          headerStyle: { backgroundColor: COLORS.teal },
          headerTintColor: 'white',
        }}
      />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={[styles.roomIconLarge, { backgroundColor: currentRoom.color + '20' }]}>
            <IconComponent size={32} color={currentRoom.color} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.propertyName}>{property?.name || 'Property'}</Text>
            <Text style={styles.roomName}>{currentRoom.name}</Text>
            <Text style={styles.roomProgress}>
              Room {currentRoomIndex + 1} of {rooms.length}
            </Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentRoomIndex + 1) / rooms.length) * 100}%` }]} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icons.Camera size={16} color={COLORS.gold} />
            <Text style={styles.statText}>{totalPhotos} photos</Text>
          </View>
          <View style={styles.statItem}>
            <Icons.CheckCircle size={16} color="#10B981" />
            <Text style={styles.statText}>{completedRooms} completed</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.instructionCard}>
          <Icons.Info size={20} color="#3B82F6" />
          <Text style={styles.instructionText}>
            Document {currentRoom.name} with photos, audio notes, and appliance details.
          </Text>
        </View>

        <View style={styles.photosSection}>
          <Text style={styles.sectionTitle}>
            Photos ({currentRoom.photos.length})
          </Text>

          {currentRoom.photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGallery}>
              {currentRoom.photos.map((photo, index) => (
                <View key={photo.id} style={styles.photoContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} resizeMode="cover" />
                  <Text style={styles.photoNumber}>#{index + 1}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyPhotos}>
              <Icons.Camera size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No photos yet</Text>
              <Text style={styles.emptySubtext}>Tap the camera button below to start</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsSection}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => setShowDetailsModal(true)}
          >
            <Icons.FileText size={20} color={COLORS.teal} />
            <View style={styles.detailsButtonContent}>
              <Text style={styles.detailsButtonTitle}>Room Details</Text>
              <Text style={styles.detailsButtonSubtitle}>
                {currentRoom.audioNotes.length} audio • Score: {currentRoom.score} • {currentRoom.appliances.length} appliances
              </Text>
            </View>
            <Icons.ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.roomGrid}>
          <Text style={styles.sectionTitle}>All Rooms</Text>
          <View style={styles.roomGridContainer}>
            {rooms.map((room, index) => {
              const RoomIcon = getIconComponent(room.icon);
              const isActive = index === currentRoomIndex;
              
              return (
                <TouchableOpacity
                  key={room.id}
                  style={[
                    styles.roomGridItem,
                    isActive && styles.roomGridItemActive,
                    room.completed && styles.roomGridItemCompleted,
                  ]}
                  onPress={() => setCurrentRoomIndex(index)}
                >
                  <View style={[styles.roomGridIcon, { backgroundColor: room.color + '20' }]}>
                    <RoomIcon size={20} color={room.color} />
                  </View>
                  <Text style={[styles.roomGridName, isActive && styles.roomGridNameActive]} numberOfLines={1}>
                    {room.name}
                  </Text>
                  {room.photos.length > 0 && (
                    <View style={styles.roomGridBadge}>
                      <Text style={styles.roomGridBadgeText}>{room.photos.length}</Text>
                    </View>
                  )}
                  {room.completed && (
                    <View style={styles.roomGridCheck}>
                      <Icons.Check size={12} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={[styles.footerButton, styles.footerButtonSecondary]}
            onPress={handleSkipRoom}
          >
            <Icons.SkipForward size={20} color="#6B7280" />
            <Text style={styles.footerButtonTextSecondary}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerButton, styles.footerButtonPrimary]}
            onPress={handleOpenCamera}
          >
            <Icons.Camera size={24} color="white" />
            <Text style={styles.footerButtonTextPrimary}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerButton, styles.footerButtonSecondary]}
            onPress={handleMarkRoomComplete}
            disabled={currentRoom.photos.length === 0}
          >
            <Icons.CheckCircle size={20} color={currentRoom.photos.length > 0 ? '#10B981' : '#D1D5DB'} />
            <Text style={[styles.footerButtonTextSecondary, currentRoom.photos.length === 0 && styles.footerButtonTextDisabled]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        {totalPhotos > 0 && (
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteSnapshot}>
            <Icons.CheckCircle size={20} color="white" />
            <Text style={styles.completeButtonText}>Complete Snapshot</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showCamera}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={styles.cameraContainer}>
          {capturedPhoto ? (
            <View style={styles.capturePreview}>
              <Image source={{ uri: capturedPhoto }} style={styles.capturePreviewImage} resizeMode="cover" />
              <View style={styles.captureOverlay}>
                <Icons.CheckCircle size={64} color="#10B981" />
                <Text style={styles.captureSuccessText}>Saving...</Text>
              </View>
            </View>
          ) : cameraPermission?.granted ? (
            <CameraView ref={cameraRef} style={styles.camera} facing={cameraFacing}>
              <View style={styles.cameraOverlay}>
                <View style={styles.cameraHeader}>
                  <TouchableOpacity style={styles.cameraCloseButton} onPress={() => setShowCamera(false)}>
                    <Icons.X size={28} color="white" />
                  </TouchableOpacity>
                  <View style={styles.cameraRoomLabel}>
                    <IconComponent size={20} color="white" />
                    <Text style={styles.cameraRoomText}>{currentRoom.name}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.cameraFlipButton}
                    onPress={() => setCameraFacing(current => current === 'back' ? 'front' : 'back')}
                  >
                    <Icons.RefreshCw size={28} color="white" />
                  </TouchableOpacity>
                </View>

                <View style={styles.cameraControls}>
                  <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                </View>
              </View>
            </CameraView>
          ) : (
            <View style={styles.cameraPermissionContainer}>
              <Icons.Camera size={64} color="#9CA3AF" />
              <Text style={styles.cameraPermissionText}>Camera permission required</Text>
              <TouchableOpacity
                style={styles.cameraPermissionButton}
                onPress={async () => {
                  const result = await requestCameraPermission();
                  if (!result?.granted) {
                    setShowCamera(false);
                    Alert.alert('Permission Denied', 'Camera permission is required');
                  }
                }}
              >
                <Text style={styles.cameraPermissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <Modal
        visible={showCompletionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.completionModalContent}>
            <View style={styles.completionHeader}>
              <Icons.CheckCircle size={48} color="#10B981" />
              <Text style={styles.completionTitle}>Review QuickStart Report</Text>
              <Text style={styles.completionSubtitle}>
                {totalPhotos} photos • {completedRooms} rooms completed
              </Text>
            </View>

            <ScrollView style={styles.completionScroll}>
              <View style={styles.completionSection}>
                <Text style={styles.completionSectionTitle}>Overall Notes</Text>
                <TextInput
                  style={styles.completionNotesInput}
                  placeholder="Add overall notes about this property inspection..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  value={overallNotes}
                  onChangeText={setOverallNotes}
                />
              </View>

              <View style={styles.completionSection}>
                <Text style={styles.completionSectionTitle}>Room Summary</Text>
                {rooms.filter(r => r.completed).map(room => (
                  <View key={room.id} style={styles.completionRoomCard}>
                    <View style={styles.completionRoomHeader}>
                      <Text style={styles.completionRoomName}>{room.name}</Text>
                      <View style={styles.completionRoomBadge}>
                        <Icons.Camera size={12} color={COLORS.gold} />
                        <Text style={styles.completionRoomBadgeText}>{room.photos.length}</Text>
                      </View>
                    </View>
                    {room.notes && (
                      <Text style={styles.completionRoomNotes} numberOfLines={2}>{room.notes}</Text>
                    )}
                    {room.appliances.length > 0 && (
                      <Text style={styles.completionRoomMeta}>
                        {room.appliances.length} appliance{room.appliances.length !== 1 ? 's' : ''} documented
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              <View style={styles.completionInfo}>
                <Icons.Info size={16} color="#3B82F6" />
                <Text style={styles.completionInfoText}>
                  This report will be saved to the property's blueprint and shared with the homeowner.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.completionActions}>
              <TouchableOpacity
                style={styles.completionCancelButton}
                onPress={() => setShowCompletionModal(false)}
              >
                <Text style={styles.completionCancelButtonText}>Back to Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.completionSubmitButton}
                onPress={handleFinalizeSnapshot}
              >
                <Icons.Check size={20} color="white" />
                <Text style={styles.completionSubmitButtonText}>Complete & Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <Icons.X size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{currentRoom.name} Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Room Score</Text>
              <View style={styles.scoreContainer}>
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => handleUpdateRoomScore(Math.max(0, currentRoom.score - 5))}
                >
                  <Icons.Minus size={20} color="white" />
                </TouchableOpacity>
                <View style={styles.scoreDisplay}>
                  <Text style={styles.scoreValue}>{currentRoom.score}</Text>
                  <Text style={styles.scoreLabel}>out of 100</Text>
                </View>
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => handleUpdateRoomScore(Math.min(100, currentRoom.score + 5))}
                >
                  <Icons.Plus size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Audio Notes ({currentRoom.audioNotes.length})</Text>
              {Platform.OS !== 'web' && (
                <TouchableOpacity
                  style={[styles.audioButton, isRecording && styles.audioButtonRecording]}
                  onPress={isRecording ? handleStopRecording : handleStartRecording}
                >
                  {isRecording ? (
                    <>
                      <Icons.Square size={20} color="white" />
                      <Text style={styles.audioButtonText}>Stop Recording</Text>
                    </>
                  ) : (
                    <>
                      <Icons.Mic size={20} color="white" />
                      <Text style={styles.audioButtonText}>Record Audio Note</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              {currentRoom.audioNotes.length > 0 && (
                <View style={styles.audioList}>
                  {currentRoom.audioNotes.map((audio, index) => (
                    <View key={audio.id} style={styles.audioItem}>
                      <Icons.Volume2 size={16} color={COLORS.teal} />
                      <Text style={styles.audioItemText}>Audio Note #{index + 1}</Text>
                      <Text style={styles.audioItemTime}>
                        {new Date(audio.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes about this room..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={currentRoom.notes}
                onChangeText={handleUpdateRoomNotes}
              />
            </View>

            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Text style={styles.modalSectionTitle}>Appliances ({currentRoom.appliances.length})</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddAppliance}>
                  <Icons.Plus size={16} color="white" />
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {currentRoom.appliances.map((appliance) => (
                <View key={appliance.id} style={styles.applianceCard}>
                  <View style={styles.applianceHeader}>
                    <Icons.Package size={20} color={COLORS.teal} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveAppliance(appliance.id)}
                    >
                      <Icons.Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.applianceInput}
                    placeholder="Appliance Name (e.g., HVAC Unit)"
                    placeholderTextColor="#9CA3AF"
                    value={appliance.name}
                    onChangeText={(text) => handleUpdateAppliance(appliance.id, 'name', text)}
                  />

                  <View style={styles.applianceRow}>
                    <TextInput
                      style={[styles.applianceInput, styles.applianceInputHalf]}
                      placeholder="Serial Number"
                      placeholderTextColor="#9CA3AF"
                      value={appliance.serialNumber}
                      onChangeText={(text) => handleUpdateAppliance(appliance.id, 'serialNumber', text)}
                    />
                    <TextInput
                      style={[styles.applianceInput, styles.applianceInputHalf]}
                      placeholder="Model Number"
                      placeholderTextColor="#9CA3AF"
                      value={appliance.modelNumber}
                      onChangeText={(text) => handleUpdateAppliance(appliance.id, 'modelNumber', text)}
                    />
                  </View>

                  <View style={styles.applianceRow}>
                    <TextInput
                      style={[styles.applianceInput, styles.applianceInputHalf]}
                      placeholder="Filter Type"
                      placeholderTextColor="#9CA3AF"
                      value={appliance.filterType}
                      onChangeText={(text) => handleUpdateAppliance(appliance.id, 'filterType', text)}
                    />
                    <TextInput
                      style={[styles.applianceInput, styles.applianceInputHalf]}
                      placeholder="Filter Size"
                      placeholderTextColor="#9CA3AF"
                      value={appliance.filterSize}
                      onChangeText={(text) => handleUpdateAppliance(appliance.id, 'filterSize', text)}
                    />
                  </View>

                  <TextInput
                    style={styles.applianceInput}
                    placeholder="Additional Notes"
                    placeholderTextColor="#9CA3AF"
                    value={appliance.notes}
                    onChangeText={(text) => handleUpdateAppliance(appliance.id, 'notes', text)}
                  />
                </View>
              ))}

              {currentRoom.appliances.length === 0 && (
                <View style={styles.emptyAppliances}>
                  <Icons.Package size={32} color="#D1D5DB" />
                  <Text style={styles.emptyAppliancesText}>No appliances added</Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <Icons.Check size={20} color="white" />
              <Text style={styles.modalSaveButtonText}>Save Details</Text>
            </TouchableOpacity>
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
  header: {
    backgroundColor: 'white',
    padding: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  roomIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  roomName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#111827',
    marginBottom: 2,
  },
  roomProgress: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600' as const,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.teal,
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EFF6FF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  photosSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
  },
  photoGallery: {
    flexDirection: 'row',
  },
  photoContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  photoNumber: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyPhotos: {
    alignItems: 'center',
    padding: 40,
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  detailsSection: {
    padding: 16,
    paddingTop: 0,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailsButtonContent: {
    flex: 1,
  },
  detailsButtonTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  detailsButtonSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  roomGrid: {
    padding: 16,
  },
  roomGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roomGridItem: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  roomGridItemActive: {
    borderColor: COLORS.teal,
    backgroundColor: COLORS.teal + '10',
  },
  roomGridItemCompleted: {
    borderColor: '#10B981',
  },
  roomGridIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomGridName: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#6B7280',
    textAlign: 'center',
  },
  roomGridNameActive: {
    color: COLORS.teal,
  },
  roomGridBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomGridBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: 'white',
  },
  roomGridCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  footerButtonPrimary: {
    backgroundColor: COLORS.teal,
    flex: 2,
  },
  footerButtonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  footerButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'white',
  },
  footerButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  footerButtonTextDisabled: {
    color: '#D1D5DB',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'white',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  cameraCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraRoomLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cameraRoomText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: 'white',
  },
  cameraFlipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.teal,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.teal,
  },
  capturePreview: {
    flex: 1,
    position: 'relative',
  },
  capturePreviewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  captureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  captureSuccessText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: 'white',
  },
  cameraPermissionContainer: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 40,
  },
  cameraPermissionText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  cameraPermissionButton: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cameraPermissionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
  },
  modalContent: {
    flex: 1,
  },
  modalSection: {
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  scoreButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreDisplay: {
    alignItems: 'center',
    minWidth: 100,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: COLORS.teal,
  },
  scoreLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.teal,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  audioButtonRecording: {
    backgroundColor: '#EF4444',
  },
  audioButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: 'white',
  },
  audioList: {
    gap: 8,
  },
  audioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  audioItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  audioItemTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'white',
  },
  applianceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  applianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  removeButton: {
    padding: 4,
  },
  applianceInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#111827',
  },
  applianceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  applianceInputHalf: {
    flex: 1,
  },
  emptyAppliances: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  emptyAppliancesText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  modalFooter: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.teal,
    paddingVertical: 16,
    borderRadius: 12,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionModalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  completionHeader: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  completionTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#111827',
  },
  completionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  completionScroll: {
    maxHeight: 400,
  },
  completionSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  completionSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
  },
  completionNotesInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  completionRoomCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  completionRoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  completionRoomName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
  },
  completionRoomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gold + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completionRoomBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.gold,
  },
  completionRoomNotes: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  completionRoomMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  completionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 20,
    backgroundColor: '#EFF6FF',
  },
  completionInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  completionActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  completionCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionCancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  completionSubmitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10B981',
  },
  completionSubmitButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: 'white',
  },
});
