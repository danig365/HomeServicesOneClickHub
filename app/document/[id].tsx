import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useVault } from '@/hooks/vault-store';
import { COLORS } from '@/constants/colors';

const categoryConfig = {
  'Property Records': { icon: 'Home', color: '#1E3A8A', bgColor: '#EBF4FF' },
  'Insurance': { icon: 'Shield', color: '#059669', bgColor: '#ECFDF5' },
  'Warranties': { icon: 'Award', color: '#DC2626', bgColor: '#FEF2F2' },
  'Maintenance': { icon: 'Wrench', color: '#D97706', bgColor: '#FFFBEB' },
  'Utilities': { icon: 'Zap', color: '#7C3AED', bgColor: '#F3E8FF' },
  'Permits': { icon: 'FileCheck', color: '#0891B2', bgColor: '#F0F9FF' },
  'Inspections': { icon: 'Search', color: '#BE185D', bgColor: '#FDF2F8' },
  'Financial': { icon: 'DollarSign', color: '#059669', bgColor: '#ECFDF5' },
  'Legal': { icon: 'Scale', color: '#374151', bgColor: '#F9FAFB' },
  'Other': { icon: 'Folder', color: '#6B7280', bgColor: '#F3F4F6' },
};

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { documents, updateDocument, deleteDocument } = useVault();
  const [isDeleting, setIsDeleting] = useState(false);

  const document = documents.find(doc => doc.id === id);

  if (!document) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Document Not Found' }} />
        <Icons.FileX size={64} color="#9CA3AF" />
        <Text style={styles.errorTitle}>Document Not Found</Text>
        <Text style={styles.errorSubtitle}>This document may have been deleted or moved.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categoryConfig_ = categoryConfig[document.category];
  const IconComponent = (Icons as any)[categoryConfig_.icon] || Icons.FileText;

  const handleToggleImportant = async () => {
    try {
      await updateDocument(document.id, { is_important: !document.is_important });
    } catch (error) {
      console.error('Error toggling important:', error);
      Alert.alert('Error', 'Failed to update document');
    }
  };

  const handleShare = async () => {
    try {
      if (document.file_url) {
        await Share.share({
          message: `${document.title} - ${document.description || 'Document from Hudson MyHome Vault'}`,
          url: document.file_url,
        });
      } else {
        await Share.share({
          message: `${document.title} - ${document.description || 'Document from Hudson MyHome Vault'}`,
        });
      }
    } catch (error) {
      console.error('Error sharing document:', error);
    }
  };

  const handleOpenFile = async () => {
    if (document.file_url) {
      try {
        await Linking.openURL(document.file_url);
      } catch (error) {
        Alert.alert('Error', 'Unable to open document file.');
      }
    } else {
      Alert.alert('No File', 'This document doesn\'t have an associated file.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteDocument(document.id);
              router.back();
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/document/edit/${document.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isExpiringSoon = () => {
    if (!document.expiration_date) return false;
    const expDate = new Date(document.expiration_date);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    return expDate <= futureDate && expDate >= new Date();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: document.title,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <Icons.Share size={20} color={COLORS.teal} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
                <Icons.Edit size={20} color={COLORS.teal} />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Document Header */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={[categoryConfig_.color, categoryConfig_.color + '80']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              {document.image_url ? (
                <Image source={{ uri: document.image_url }} style={styles.documentImage} />
              ) : (
                <View style={[styles.documentIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <IconComponent size={48} color="white" />
                </View>
              )}
              
              <View style={styles.headerInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.documentTitle} numberOfLines={2}>{document.title}</Text>
                  <TouchableOpacity onPress={handleToggleImportant}>
                    <Icons.Star 
                      size={24} 
                      color={document.is_important ? '#F59E0B' : 'rgba(255,255,255,0.6)'} 
                      fill={document.is_important ? '#F59E0B' : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.documentCategory}>{document.category}</Text>
                {document.size && (
                  <Text style={styles.documentSize}>{document.size}</Text>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleOpenFile}>
            <Icons.Eye size={20} color={COLORS.teal} />
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Icons.Share size={20} color={COLORS.teal} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Icons.Edit size={20} color={COLORS.teal} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <Icons.Trash2 size={20} color="#DC2626" />
            <Text style={[styles.actionText, styles.deleteText]}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Document Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Document Details</Text>
          
          {document.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{document.description}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{document.type}</Text>
          </View>
          
          {document.file_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>File Name</Text>
              <Text style={styles.detailValue}>{document.file_name}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date Added</Text>
            <Text style={styles.detailValue}>{formatDate(document.created_at)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Modified</Text>
            <Text style={styles.detailValue}>{formatDate(document.updated_at)}</Text>
          </View>
          
          {document.expiration_date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expiration Date</Text>
              <View style={styles.expirationContainer}>
                <Text style={[
                  styles.detailValue,
                  isExpiringSoon() && styles.expiringText
                ]}>
                  {formatDate(document.expiration_date)}
                </Text>
                {isExpiringSoon() && (
                  <View style={styles.expiringBadge}>
                    <Icons.AlertTriangle size={12} color="#DC2626" />
                    <Text style={styles.expiringBadgeText}>Expiring Soon</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {document.reminder_date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reminder Date</Text>
              <Text style={styles.detailValue}>{formatDate(document.reminder_date)}</Text>
            </View>
          )}
          
          {document.tags && document.tags.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tags</Text>
              <View style={styles.tagsContainer}>
                {document.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  headerSection: {
    marginBottom: 16,
  },
  headerGradient: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  documentImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  documentIcon: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  documentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    marginRight: 12,
  },
  documentCategory: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deleteButton: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.teal,
  },
  deleteText: {
    color: '#DC2626',
  },
  detailsSection: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
  },
  expirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expiringText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  expiringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  expiringBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});