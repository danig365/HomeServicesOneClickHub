import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform, Image } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { useProperties } from '@/hooks/properties-store';
import { useSnapshots } from '@/hooks/snapshot-store';
import { useSubscription } from '@/hooks/subscription-store';
import { COLORS } from '@/constants/colors';
import { RoomInspection, MediaNote } from '@/types/tech-appointment';

const ROOM_TYPES = [
  { value: 'kitchen', label: 'Kitchen', icon: 'ChefHat' },
  { value: 'bathroom', label: 'Bathroom', icon: 'Bath' },
  { value: 'bedroom', label: 'Bedroom', icon: 'Bed' },
  { value: 'living', label: 'Living Room', icon: 'Sofa' },
  { value: 'dining', label: 'Dining Room', icon: 'UtensilsCrossed' },
  { value: 'laundry', label: 'Laundry', icon: 'WashingMachine' },
  { value: 'garage', label: 'Garage', icon: 'Car' },
  { value: 'basement', label: 'Basement', icon: 'Home' },
  { value: 'attic', label: 'Attic', icon: 'Home' },
  { value: 'other', label: 'Other', icon: 'Home' },
] as const;

export default function SnapshotInspectionScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { properties } = useProperties();
  const { 
    snapshots,
    addRoomInspection, 
    updateRoomInspection,
    updateSnapshotScores,
    completeSnapshot,
    assignSnapshotToProperty
  } = useSnapshots();
  const { updateScore } = useSubscription();

  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showRoomDetailModal, setShowRoomDetailModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomInspection | null>(null);
  const [showScoresModal, setShowScoresModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<typeof ROOM_TYPES[number]['value']>('other');
  const [newRoomScore, setNewRoomScore] = useState('85');
  const [newRoomNotes, setNewRoomNotes] = useState('');
  
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const cameraRef = useRef<any>(null);

  const snapshot = snapshots.find(s => s.id === id);
  const property = snapshot?.propertyId ? properties.find(p => p.id === snapshot.propertyId) : null;

  const [structuralScore, setStructuralScore] = useState(snapshot?.structuralScore?.toString() || '85');
  const [mechanicalScore, setMechanicalScore] = useState(snapshot?.mechanicalScore?.toString() || '85');
  const [aestheticScore, setAestheticScore] = useState(snapshot?.aestheticScore?.toString() || '85');
  const [efficiencyScore, setEfficiencyScore] = useState(snapshot?.efficiencyScore?.toString() || '85');
  const [safetyScore, setSafetyScore] = useState(snapshot?.safetyScore?.toString() || '85');

  useEffect(() => {
    if (snapshot) {
      setStructuralScore(snapshot.structuralScore?.toString() || '85');
      setMechanicalScore(snapshot.mechanicalScore?.toString() || '85');
      setAestheticScore(snapshot.aestheticScore?.toString() || '85');
      setEfficiencyScore(snapshot.efficiencyScore?.toString() || '85');
      setSafetyScore(snapshot.safetyScore?.toString() || '85');
    }
  }, [snapshot]);



  if (!snapshot) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen 
          options={{ 
            title: 'MyHome Snapshot',
            headerStyle: { backgroundColor: '#F59E0B' },
            headerTintColor: 'white',
          }} 
        />
        <View style={styles.errorContainer}>
          <Icons.AlertCircle size={64} color="#EF4444" />
          <Text style={styles.errorText}>Snapshot inspection not found</Text>
          <Text style={styles.errorSubtext}>This appointment does not have a snapshot inspection.</Text>
        </View>
      </View>
    );
  }

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }

    const score = parseInt(newRoomScore) || 85;

    if (!snapshot) return;

    await addRoomInspection(snapshot.id, {
      roomName: newRoomName,
      roomType: newRoomType,
      score,
      notes: newRoomNotes,
      images: [],
      audioNotes: [],
      issues: [],
      recommendations: [],
    });

    setNewRoomName('');
    setNewRoomType('other');
    setNewRoomScore('85');
    setNewRoomNotes('');
    setShowAddRoomModal(false);
    Alert.alert('Success', 'Room added to inspection');
  };

  const handleOpenCamera = async (roomId?: string, mode: 'photo' | 'video' = 'photo') => {
    console.log('[Camera] Opening camera for room:', roomId, 'mode:', mode);
    console.log('[Camera] Current permission:', cameraPermission);
    
    if (!roomId) {
      Alert.alert('Error', 'Please select a room first');
      return;
    }
    
    if (!cameraPermission) {
      console.log('[Camera] Permission object is null, requesting...');
      const result = await requestCameraPermission();
      console.log('[Camera] Permission result:', result);
      
      if (!result?.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos and videos');
        return;
      }
    } else if (!cameraPermission.granted) {
      console.log('[Camera] Permission not granted, requesting...');
      const result = await requestCameraPermission();
      console.log('[Camera] Permission result:', result);
      
      if (!result?.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos and videos');
        return;
      }
    }

    console.log('[Camera] Permission granted, setting room and opening camera modal');
    setCurrentRoomId(roomId);
    setShowCameraModal(true);
  };

  const handleTakePhoto = async () => {
    console.log('[Camera] Taking photo, currentRoomId:', currentRoomId);
    
    if (!cameraRef.current) {
      console.log('[Camera] Camera ref not available');
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    if (!currentRoomId) {
      console.log('[Camera] No room selected');
      Alert.alert('Error', 'No room selected');
      return;
    }

    if (!snapshot) {
      console.log('[Camera] No snapshot available');
      Alert.alert('Error', 'Snapshot not found');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      console.log('[Snapshot] Photo captured:', photo);

      if (photo && photo.uri) {
        const room = snapshot.rooms.find(r => r.id === currentRoomId);
        if (room) {
          const photoUri = String(photo.uri);
          console.log('[Snapshot] Adding photo to room:', currentRoomId, 'URI:', photoUri);
          
          const newImage: MediaNote = {
            id: `img-${Date.now()}`,
            type: 'image' as const,
            uri: photoUri,
            timestamp: new Date().toISOString(),
          };
          
          await updateRoomInspection(snapshot.id, currentRoomId, {
            images: [...room.images, newImage],
          });
          
          setCapturedMedia(photoUri);
          setTimeout(() => {
            setCapturedMedia(null);
            setShowCameraModal(false);
            setCurrentRoomId(null);
          }, 1500);
          Alert.alert('Success', 'Photo captured and saved');
        } else {
          console.log('[Camera] Room not found:', currentRoomId);
          Alert.alert('Error', 'Room not found');
        }
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleStartVideoRecording = async () => {
    console.log('[Camera] Starting video recording, currentRoomId:', currentRoomId);
    
    if (!cameraRef.current) {
      console.log('[Camera] Camera ref not available');
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    if (isRecordingVideo) {
      console.log('[Camera] Already recording');
      return;
    }

    if (!currentRoomId) {
      console.log('[Camera] No room selected');
      Alert.alert('Error', 'No room selected');
      return;
    }

    if (!snapshot) {
      console.log('[Camera] No snapshot available');
      Alert.alert('Error', 'Snapshot not found');
      return;
    }

    try {
      setIsRecordingVideo(true);
      const video = await cameraRef.current.recordAsync({
        maxDuration: 60,
      });

      console.log('[Snapshot] Video recorded:', video);

      if (video && video.uri) {
        const room = snapshot.rooms.find(r => r.id === currentRoomId);
        if (room) {
          const videoUri = String(video.uri);
          console.log('[Snapshot] Adding video to room:', currentRoomId, 'URI:', videoUri);
          
          const newVideo: MediaNote = {
            id: `video-${Date.now()}`,
            type: 'image' as const,
            uri: videoUri,
            timestamp: new Date().toISOString(),
            notes: 'Video recording',
          };
          
          await updateRoomInspection(snapshot.id, currentRoomId, {
            images: [...room.images, newVideo],
          });
          
          setShowCameraModal(false);
          setCurrentRoomId(null);
          Alert.alert('Success', 'Video recorded and saved');
        } else {
          console.log('[Camera] Room not found:', currentRoomId);
          Alert.alert('Error', 'Room not found');
        }
      }
    } catch (error) {
      console.error('Failed to record video:', error);
      Alert.alert('Error', 'Failed to record video');
    } finally {
      setIsRecordingVideo(false);
    }
  };

  const handleStopVideoRecording = async () => {
    if (!cameraRef.current || !isRecordingVideo) return;

    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handleStartRecording = async (roomId?: string) => {
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

  const handleStopRecording = async (roomId?: string) => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      
      const uri = recording.getURI();
      if (uri && roomId && snapshot) {
        const room = snapshot.rooms.find(r => r.id === roomId);
        if (room) {
          const newAudio = {
            id: `audio-${Date.now()}`,
            type: 'audio' as const,
            uri,
            timestamp: new Date().toISOString(),
          };
          await updateRoomInspection(snapshot.id, roomId, {
            audioNotes: [...room.audioNotes, newAudio],
          });
          Alert.alert('Success', 'Audio note saved');
        }
      }

      setRecording(null);
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save audio note');
    }
  };

  const handleUpdateScores = async () => {
    if (!snapshot) return;

    const scores = {
      structuralScore: parseInt(structuralScore) || 85,
      mechanicalScore: parseInt(mechanicalScore) || 85,
      aestheticScore: parseInt(aestheticScore) || 85,
      efficiencyScore: parseInt(efficiencyScore) || 85,
      safetyScore: parseInt(safetyScore) || 85,
    };

    await updateSnapshotScores(snapshot.id, scores);
    setShowScoresModal(false);
    Alert.alert('Success', 'Scores updated');
  };

  const handleCompleteInspection = async () => {
    if (!snapshot) return;

    if (snapshot.rooms.length === 0) {
      Alert.alert('Error', 'Please add at least one room inspection');
      return;
    }

    if (!snapshot.propertyId) {
      Alert.alert(
        'Assign Property',
        'Please assign this snapshot to a property before completing.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Assign Property', onPress: () => setShowPropertyModal(true) },
        ]
      );
      return;
    }

    Alert.alert(
      'Complete Inspection',
      'This will finalize the snapshot and create the home score. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            await completeSnapshot(snapshot.id);
            
            const overallScore = Math.round(
              (snapshot.structuralScore + snapshot.mechanicalScore + snapshot.aestheticScore + 
               snapshot.efficiencyScore + snapshot.safetyScore) / 5
            );

            if (snapshot.propertyId) {
              await updateScore(snapshot.propertyId, {
                id: `score-${Date.now()}`,
                propertyId: snapshot.propertyId,
                score: overallScore,
                quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
                year: new Date().getFullYear(),
                categories: {
                  structural: snapshot.structuralScore,
                  mechanical: snapshot.mechanicalScore,
                  aesthetic: snapshot.aestheticScore,
                  efficiency: snapshot.efficiencyScore,
                  safety: snapshot.safetyScore,
                },
                improvements: [],
                recommendations: [],
                createdAt: new Date().toISOString(),
              });
            }

            Alert.alert('Success', 'Snapshot inspection completed and home score created');
            router.back();
          },
        },
      ]
    );
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Home;
  };

  const handleAssignProperty = async () => {
    if (!snapshot || !selectedPropertyId) {
      Alert.alert('Error', 'Please select a property');
      return;
    }

    await assignSnapshotToProperty(snapshot.id, selectedPropertyId);
    setShowPropertyModal(false);
    Alert.alert('Success', 'Property assigned to snapshot');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{ 
          title: 'MyHome Snapshot',
          headerStyle: { backgroundColor: '#F59E0B' },
          headerTintColor: 'white',
        }} 
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Icons.Camera size={32} color="#F59E0B" />
          <Text style={styles.headerTitle}>MyHome Snapshot Inspection</Text>
          {property ? (
            <Text style={styles.headerSubtitle}>{property.name}</Text>
          ) : (
            <TouchableOpacity
              style={styles.assignPropertyButton}
              onPress={() => setShowPropertyModal(true)}
            >
              <Icons.MapPin size={16} color="#F59E0B" />
              <Text style={styles.assignPropertyText}>Assign to Property</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{snapshot.overallScore}</Text>
            <Text style={styles.scoreLabel}>Overall</Text>
          </View>
          <TouchableOpacity style={styles.editScoresButton} onPress={() => setShowScoresModal(true)}>
            <Icons.Edit2 size={18} color="#F59E0B" />
            <Text style={styles.editScoresText}>Edit Category Scores</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Room Inspections ({snapshot.rooms.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddRoomModal(true)}
            >
              <Icons.Plus size={20} color="white" />
              <Text style={styles.addButtonText}>Add Room</Text>
            </TouchableOpacity>
          </View>

          {snapshot.rooms.length === 0 ? (
            <View style={styles.emptyState}>
              <Icons.Home size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No rooms inspected yet</Text>
              <Text style={styles.emptySubtext}>Add rooms to begin the inspection</Text>
            </View>
          ) : (
            snapshot.rooms.map((room) => {
              const roomTypeInfo = ROOM_TYPES.find(rt => rt.value === room.roomType);
              const IconComponent = roomTypeInfo ? getIconComponent(roomTypeInfo.icon) : Icons.Home;

              return (
                <TouchableOpacity
                  key={room.id}
                  style={styles.roomCard}
                  onPress={() => {
                    setSelectedRoom(room);
                    setShowRoomDetailModal(true);
                  }}
                >
                  <View style={styles.roomHeader}>
                    <View style={styles.roomInfo}>
                      <View style={styles.roomIconContainer}>
                        <IconComponent size={20} color="#F59E0B" />
                      </View>
                      <View>
                        <Text style={styles.roomName}>{room.roomName}</Text>
                        <Text style={styles.roomType}>{roomTypeInfo?.label || 'Other'}</Text>
                      </View>
                    </View>
                    <View style={styles.roomScore}>
                      <Text style={styles.roomScoreNumber}>{room.score}</Text>
                    </View>
                  </View>

                  <View style={styles.roomMeta}>
                    {room.images.length > 0 && (
                      <View style={styles.metaBadge}>
                        <Icons.Image size={14} color="#6B7280" />
                        <Text style={styles.metaBadgeText}>{room.images.length}</Text>
                      </View>
                    )}
                    {room.audioNotes.length > 0 && (
                      <View style={styles.metaBadge}>
                        <Icons.Mic size={14} color="#6B7280" />
                        <Text style={styles.metaBadgeText}>{room.audioNotes.length}</Text>
                      </View>
                    )}
                    {room.issues.length > 0 && (
                      <View style={styles.metaBadge}>
                        <Icons.AlertCircle size={14} color="#EF4444" />
                        <Text style={[styles.metaBadgeText, { color: '#EF4444' }]}>{room.issues.length}</Text>
                      </View>
                    )}
                  </View>

                  {room.notes && (
                    <Text style={styles.roomNotes} numberOfLines={2}>{room.notes}</Text>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {snapshot.rooms.length > 0 && !snapshot.completedAt && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.completeButton} onPress={handleCompleteInspection}>
              <Icons.CheckCircle size={24} color="white" />
              <Text style={styles.completeButtonText}>Complete Inspection</Text>
            </TouchableOpacity>
          </View>
        )}

        {snapshot.completedAt && (
          <View style={styles.completedBanner}>
            <Icons.CheckCircle size={20} color="#10B981" />
            <Text style={styles.completedText}>
              Inspection completed on {new Date(snapshot.completedAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAddRoomModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddRoomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Room Inspection</Text>
              <TouchableOpacity onPress={() => setShowAddRoomModal(false)}>
                <Icons.X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Room Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Master Bedroom"
                  placeholderTextColor="#9CA3AF"
                  value={newRoomName}
                  onChangeText={setNewRoomName}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Room Type</Text>
                <View style={styles.roomTypeGrid}>
                  {ROOM_TYPES.map((type) => {
                    const IconComponent = getIconComponent(type.icon);
                    return (
                      <TouchableOpacity
                        key={type.value}
                        style={[styles.roomTypeOption, newRoomType === type.value && styles.roomTypeOptionActive]}
                        onPress={() => setNewRoomType(type.value)}
                      >
                        <IconComponent size={20} color={newRoomType === type.value ? 'white' : '#F59E0B'} />
                        <Text style={[styles.roomTypeText, newRoomType === type.value && styles.roomTypeTextActive]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Room Score (0-100)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="85"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={newRoomScore}
                  onChangeText={setNewRoomScore}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput]}
                  placeholder="Add inspection notes..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  value={newRoomNotes}
                  onChangeText={setNewRoomNotes}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddRoom}>
                <Icons.Plus size={20} color="white" />
                <Text style={styles.submitButtonText}>Add Room</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRoomDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRoomDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedRoom?.roomName}</Text>
              <TouchableOpacity onPress={() => setShowRoomDetailModal(false)}>
                <Icons.X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedRoom && (
                <>
                  <View style={styles.roomDetailScore}>
                    <Text style={styles.roomDetailScoreNumber}>{selectedRoom.score}</Text>
                    <Text style={styles.roomDetailScoreLabel}>Room Score</Text>
                  </View>

                  <View style={styles.mediaButtons}>
                    <TouchableOpacity
                      style={styles.mediaButton}
                      onPress={() => handleOpenCamera(selectedRoom.id, 'photo')}
                    >
                      <Icons.Camera size={20} color="#F59E0B" />
                      <Text style={styles.mediaButtonText}>Photo</Text>
                    </TouchableOpacity>
                    
                    {Platform.OS !== 'web' && (
                      <>
                        <TouchableOpacity
                          style={styles.mediaButton}
                          onPress={() => handleOpenCamera(selectedRoom.id, 'video')}
                        >
                          <Icons.Video size={20} color="#F59E0B" />
                          <Text style={styles.mediaButtonText}>Video</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.mediaButton, isRecording && styles.mediaButtonRecording]}
                          onPress={isRecording ? () => handleStopRecording(selectedRoom.id) : () => handleStartRecording(selectedRoom.id)}
                        >
                          <Icons.Mic size={20} color={isRecording ? 'white' : '#F59E0B'} />
                          <Text style={[styles.mediaButtonText, isRecording && styles.mediaButtonTextRecording]}>
                            {isRecording ? 'Stop' : 'Audio'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                  {selectedRoom.images.length > 0 && (
                    <View style={styles.mediaSection}>
                      <Text style={styles.mediaSectionTitle}>Photos & Videos ({selectedRoom.images.length})</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaGallery}>
                        {selectedRoom.images.map((img) => {
                          const imageUri = typeof img.uri === 'string' ? img.uri : String(img.uri);
                          const isVideo = img.notes === 'Video recording';
                          
                          return (
                            <View key={img.id} style={styles.mediaPreviewContainer}>
                              <Image 
                                source={{ uri: imageUri }} 
                                style={styles.mediaPreview} 
                                resizeMode="cover"
                              />
                              {isVideo && (
                                <View style={styles.videoIndicator}>
                                  <Icons.Video size={16} color="white" />
                                </View>
                              )}
                              {img.notes && !isVideo && (
                                <View style={styles.mediaNoteBadge}>
                                  <Icons.FileText size={12} color="white" />
                                </View>
                              )}
                              <Text style={styles.mediaTimestamp}>
                                {new Date(img.timestamp).toLocaleTimeString()}
                              </Text>
                            </View>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {selectedRoom.audioNotes.length > 0 && (
                    <View style={styles.mediaSection}>
                      <Text style={styles.mediaSectionTitle}>Audio Notes ({selectedRoom.audioNotes.length})</Text>
                      {selectedRoom.audioNotes.map((audio, index) => (
                        <View key={audio.id} style={styles.audioNoteItem}>
                          <View style={styles.audioNoteIcon}>
                            <Icons.Mic size={16} color="white" />
                          </View>
                          <View style={styles.audioNoteInfo}>
                            <Text style={styles.audioNoteTitle}>Audio Note {index + 1}</Text>
                            <Text style={styles.audioNoteTime}>
                              {new Date(audio.timestamp).toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedRoom.notes && (
                    <View style={styles.notesSection}>
                      <Text style={styles.notesSectionTitle}>Notes</Text>
                      <Text style={styles.notesText}>{selectedRoom.notes}</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showScoresModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowScoresModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Category Scores</Text>
              <TouchableOpacity onPress={() => setShowScoresModal(false)}>
                <Icons.X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Structural (0-100)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="85"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={structuralScore}
                  onChangeText={setStructuralScore}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Mechanical (0-100)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="85"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={mechanicalScore}
                  onChangeText={setMechanicalScore}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Aesthetic (0-100)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="85"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={aestheticScore}
                  onChangeText={setAestheticScore}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Efficiency (0-100)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="85"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={efficiencyScore}
                  onChangeText={setEfficiencyScore}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Safety (0-100)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="85"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={safetyScore}
                  onChangeText={setSafetyScore}
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleUpdateScores}>
                <Icons.Save size={20} color="white" />
                <Text style={styles.submitButtonText}>Update Scores</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPropertyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPropertyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign to Property</Text>
              <TouchableOpacity onPress={() => setShowPropertyModal(false)}>
                <Icons.X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.propertyModalDescription}>
                Select a property to assign this snapshot inspection to.
              </Text>

              <View style={styles.propertiesList}>
                {properties.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Icons.Home size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No properties available</Text>
                  </View>
                ) : (
                  properties.map((prop) => (
                    <TouchableOpacity
                      key={prop.id}
                      style={[
                        styles.propertyOption,
                        selectedPropertyId === prop.id && styles.propertyOptionSelected
                      ]}
                      onPress={() => setSelectedPropertyId(prop.id)}
                    >
                      <View style={styles.propertyOptionInfo}>
                        <Icons.Home size={20} color={selectedPropertyId === prop.id ? '#F59E0B' : '#6B7280'} />
                        <View style={styles.propertyOptionDetails}>
                          <Text style={[
                            styles.propertyOptionName,
                            selectedPropertyId === prop.id && styles.propertyOptionNameSelected
                          ]}>
                            {prop.name}
                          </Text>
                          <Text style={styles.propertyOptionAddress}>{prop.address}</Text>
                        </View>
                      </View>
                      {selectedPropertyId === prop.id && <Icons.Check size={20} color="#F59E0B" />}
                    </TouchableOpacity>
                  ))
                )}
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAssignProperty}
              >
                <Icons.Check size={20} color="white" />
                <Text style={styles.submitButtonText}>Assign Property</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCameraModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCameraModal(false)}
      >
        <View style={styles.cameraContainer}>
          {capturedMedia ? (
            <View style={styles.capturePreview}>
              <Image 
                source={{ uri: typeof capturedMedia === 'string' ? capturedMedia : String(capturedMedia) }} 
                style={styles.capturePreviewImage} 
                resizeMode="cover"
              />
              <View style={styles.captureOverlay}>
                <Icons.CheckCircle size={64} color="#10B981" />
                <Text style={styles.captureSuccessText}>Captured!</Text>
              </View>
            </View>
          ) : cameraPermission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={cameraFacing}
            >
              <View style={styles.cameraOverlay}>
                <View style={styles.cameraHeader}>
                  <TouchableOpacity
                    style={styles.cameraCloseButton}
                    onPress={() => setShowCameraModal(false)}
                  >
                    <Icons.X size={28} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cameraFlipButton}
                    onPress={() => setCameraFacing(current => current === 'back' ? 'front' : 'back')}
                  >
                    <Icons.RefreshCw size={28} color="white" />
                  </TouchableOpacity>
                </View>

                <View style={styles.cameraControls}>
                  <TouchableOpacity
                    style={styles.captureButton}
                    onPress={handleTakePhoto}
                  >
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                  
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity
                      style={[styles.videoButton, isRecordingVideo && styles.videoButtonRecording]}
                      onPress={isRecordingVideo ? handleStopVideoRecording : handleStartVideoRecording}
                    >
                      {isRecordingVideo ? (
                        <Icons.Square size={24} color="white" />
                      ) : (
                        <Icons.Video size={24} color="white" />
                      )}
                    </TouchableOpacity>
                  )}
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
                    setShowCameraModal(false);
                    Alert.alert('Permission Denied', 'Camera permission is required to take photos');
                  }
                }}
              >
                <Text style={styles.cameraPermissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  assignPropertyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: 'white',
  },
  assignPropertyText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  scoreCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: 'white',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  editScoresButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  editScoresText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  roomCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  roomIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  roomType: {
    fontSize: 13,
    color: '#6B7280',
  },
  roomScore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomScoreNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'white',
  },
  roomMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  roomNotes: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
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
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textAreaInput: {
    minHeight: 100,
  },
  roomTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: 'white',
  },
  roomTypeOptionActive: {
    backgroundColor: '#F59E0B',
  },
  roomTypeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  roomTypeTextActive: {
    color: 'white',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F59E0B',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'white',
  },
  roomDetailScore: {
    alignItems: 'center',
    marginBottom: 24,
  },
  roomDetailScoreNumber: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#F59E0B',
  },
  roomDetailScoreLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginTop: 4,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: 'white',
  },
  mediaButtonRecording: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  mediaButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  mediaButtonTextRecording: {
    color: 'white',
  },
  mediaSection: {
    marginBottom: 20,
  },
  mediaSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
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
  notesSection: {
    marginBottom: 20,
  },
  notesSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  propertyModalDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 20,
  },
  propertiesList: {
    gap: 12,
    marginBottom: 20,
  },
  propertyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  propertyOptionSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  propertyOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  propertyOptionDetails: {
    flex: 1,
  },
  propertyOptionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  propertyOptionNameSelected: {
    color: '#F59E0B',
  },
  propertyOptionAddress: {
    fontSize: 13,
    color: '#6B7280',
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
    padding: 20,
    paddingTop: 60,
  },
  cameraCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFlipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    gap: 30,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#F59E0B',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F59E0B',
  },
  videoButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoButtonRecording: {
    backgroundColor: '#EF4444',
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
  mediaGallery: {
    flexDirection: 'row',
  },
  mediaPreviewContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  mediaPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  mediaTimestamp: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  audioNoteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    marginBottom: 8,
  },
  audioNoteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioNoteInfo: {
    flex: 1,
  },
  audioNoteTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  audioNoteTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  mediaNoteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cameraPermissionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
});
