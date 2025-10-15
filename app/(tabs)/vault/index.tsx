import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useVault } from '@/hooks/vault-store';
import { DocumentCategory } from '@/types/document';
import { useProperties } from '@/hooks/properties-store';
import PropertySelector from '@/components/PropertySelector';
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

export default function VaultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    documents, 
    isLoading, 
    getDocumentsByCategory, 
    getImportantDocuments, 
    getExpiringDocuments,
    searchDocuments 
  } = useVault();
  const { selectedproperty_id } = useProperties();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'important' | 'expiring'>('all');

  const filteredDocuments = useMemo(() => {
    let docs = documents;
    
    if (selectedproperty_id) {
      docs = docs.filter(doc => doc.property_id === selectedproperty_id);
    }
    
    if (searchQuery.trim()) {
      docs = searchDocuments(searchQuery).filter(doc => 
        !selectedproperty_id || doc.property_id === selectedproperty_id
      );
    }
    
    switch (selectedFilter) {
      case 'important':
        return docs.filter(doc => doc.isImportant);
      case 'expiring':
        return docs.filter(doc => {
          if (!doc.expirationDate) return false;
          const expDate = new Date(doc.expirationDate);
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 30);
          return expDate <= futureDate && expDate >= new Date();
        });
      default:
        return docs;
    }
  }, [documents, searchQuery, selectedFilter, searchDocuments, selectedproperty_id]);

  const categoryStats = useMemo(() => {
    const stats: Record<DocumentCategory, number> = {} as Record<DocumentCategory, number>;
    Object.keys(categoryConfig).forEach(category => {
      const categoryDocs = getDocumentsByCategory(category as DocumentCategory);
      const filtered = selectedproperty_id 
        ? categoryDocs.filter(doc => doc.property_id === selectedproperty_id)
        : categoryDocs;
      stats[category as DocumentCategory] = filtered.length;
    });
    return stats;
  }, [getDocumentsByCategory, selectedproperty_id]);

  const importantCount = useMemo(() => {
    const docs = getImportantDocuments();
    return selectedproperty_id 
      ? docs.filter(doc => doc.property_id === selectedproperty_id).length
      : docs.length;
  }, [getImportantDocuments, selectedproperty_id]);
  
  const expiringCount = useMemo(() => {
    const docs = getExpiringDocuments();
    return selectedproperty_id 
      ? docs.filter(doc => doc.property_id === selectedproperty_id).length
      : docs.length;
  }, [getExpiringDocuments, selectedproperty_id]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={[COLORS.teal, COLORS.darkTeal]}
        style={styles.headerGradient}
      >
        <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>MyHome Vault</Text>
                <Text style={styles.headerSubtitle}>Your home&apos;s digital CarFax</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/document/add')}
              >
                <Icons.Plus size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <PropertySelector style={styles.propertySelector} />
            
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Icons.FileText size={20} color={COLORS.gold} />
                <Text style={styles.statNumber}>{filteredDocuments.length}</Text>
                <Text style={styles.statLabel}>Documents</Text>
              </View>
              <View style={styles.statCard}>
                <Icons.Star size={20} color={COLORS.accent.warning} />
                <Text style={styles.statNumber}>{importantCount}</Text>
                <Text style={styles.statLabel}>Important</Text>
              </View>
              <View style={styles.statCard}>
                <Icons.Clock size={20} color={COLORS.accent.error} />
                <Text style={styles.statNumber}>{expiringCount}</Text>
                <Text style={styles.statLabel}>Expiring</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
        <Icons.Search size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icons.X size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        {[
          { key: 'all', label: 'All Documents', count: filteredDocuments.length },
          { key: 'important', label: 'Important', count: importantCount },
          { key: 'expiring', label: 'Expiring Soon', count: expiringCount },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              selectedFilter === filter.key && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter(filter.key as any)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter.key && styles.filterTextActive
            ]}>
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCategoryGrid = () => (
    <View style={styles.categorySection}>
      <Text style={styles.sectionTitle}>Browse by Category</Text>
      <View style={styles.categoryGrid}>
        {Object.entries(categoryConfig).map(([category, config]) => {
          const IconComponent = (Icons as any)[config.icon] || Icons.Folder;
          const count = categoryStats[category as DocumentCategory] || 0;
          
          return (
            <TouchableOpacity
              key={category}
              style={[styles.categoryCard, { backgroundColor: config.bgColor }]}
              onPress={() => {
                // Navigate to category view or filter
                setSearchQuery('');
                setSelectedFilter('all');
                // You could implement category filtering here
              }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: config.color }]}>
                <IconComponent size={24} color="white" />
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>{category}</Text>
              <Text style={[styles.categoryCount, { color: config.color }]}>{count} docs</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderDocumentsList = () => (
    <View style={styles.documentsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedFilter === 'all' ? 'Recent Documents' : 
           selectedFilter === 'important' ? 'Important Documents' : 
           'Expiring Soon'}
        </Text>
        <Text style={styles.documentCount}>{filteredDocuments.length} documents</Text>
      </View>
      
      {filteredDocuments.length === 0 ? (
        <View style={styles.emptyState}>
          <Icons.FileText size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No documents found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Try adjusting your search' : 'Add your first document to get started'}
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/document/add')}
          >
            <Text style={styles.emptyButtonText}>Add Document</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.documentsList}>
          {filteredDocuments.slice(0, 10).map((document) => {
            const categoryConfig_ = categoryConfig[document.category];
            const IconComponent = (Icons as any)[categoryConfig_.icon] || Icons.FileText;
            
            return (
              <TouchableOpacity
                key={document.id}
                style={styles.documentCard}
                onPress={() => router.push(`/document/${document.id}`)}
              >
                <View style={styles.documentLeft}>
                  {document.imageUrl ? (
                    <Image source={{ uri: document.imageUrl }} style={styles.documentImage} />
                  ) : (
                    <View style={[styles.documentIconContainer, { backgroundColor: categoryConfig_.bgColor }]}>
                      <IconComponent size={20} color={categoryConfig_.color} />
                    </View>
                  )}
                  <View style={styles.documentInfo}>
                    <View style={styles.documentHeader}>
                      <Text style={styles.documentTitle} numberOfLines={1}>{document.title}</Text>
                      {document.isImportant && (
                        <Icons.Star size={16} color="#F59E0B" fill="#F59E0B" />
                      )}
                    </View>
                    <Text style={styles.documentCategory}>{document.category}</Text>
                    <Text style={styles.documentDate}>Added {document.dateAdded}</Text>
                  </View>
                </View>
                <View style={styles.documentRight}>
                  {document.size && (
                    <Text style={styles.documentSize}>{document.size}</Text>
                  )}
                  <Icons.ChevronRight size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your vault...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {renderSearchAndFilters()}
        {renderCategoryGrid()}
        {renderDocumentsList()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerContainer: {
    marginBottom: 0,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.teal,
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  categorySection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  documentsSection: {
    padding: 20,
    backgroundColor: 'white',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  documentCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  documentsList: {
    gap: 12,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  documentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  documentImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  documentCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  documentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  documentSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  headerSafeArea: {
    // Dynamic padding top will be applied inline
  },
  propertySelector: {
    marginBottom: 16,
  },
});