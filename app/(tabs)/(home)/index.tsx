import React, { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Image, SafeAreaView, Linking, Platform } from 'react-native';
import { services, categories } from '@/constants/services';
import ServiceCard from '@/components/ServiceCard';
import * as Icons from 'lucide-react-native';
import { useCart } from '@/hooks/cart-store';
import { useSubscription } from '@/hooks/subscription-store';
import { useProperties } from '@/hooks/properties-store';
import { useUser } from '@/hooks/user-store';
import { Service } from '@/types/service';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppointments } from '@/hooks/appointments-store';
import { COLORS } from '@/constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high'>('popular');
  const { addToCart } = useCart();
  const { getSelectedProperty } = useProperties();
  const { getSubscription, getNextVisit } = useSubscription();
  const property = getSelectedProperty();
  const subscription = property ? getSubscription(property.id) : null;
  const nextVisit = property && subscription ? getNextVisit(property.id) : null;
  const { currentUser } = useUser();

  const { getUpcomingAppointments, isLoading: appointmentsLoading } = useAppointments();
  const upcomingAppointments = getUpcomingAppointments().slice(0, 3);
  
  console.log('DEBUG - appointmentsLoading:', appointmentsLoading);
  console.log('DEBUG - upcomingAppointments count:', upcomingAppointments.length);
  console.log('DEBUG - upcomingAppointments data:', JSON.stringify(upcomingAppointments, null, 2));

  const getIconComponent = (iconName: string): React.ComponentType<any> => {
    return (Icons as any)[iconName] || Icons.Info;
  };

  const getPropertyInsights = () => {
    if (!property || !property.insights) return [];
    return property.insights.slice(0, 4);
  };

  const insights = getPropertyInsights();

  const filteredServices = useMemo(() => {
    let filtered = services;
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return 0;
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [searchQuery, selectedCategory, sortBy]);

  const popularServices = useMemo(() => 
    services.filter(s => s.popular).slice(0, 3), []
  );

  const handleQuickAdd = (service: Service) => {
    addToCart(service);
    Alert.alert(
      '🎉 Added to Cart!',
      `${service.name} is ready for checkout. Keep shopping or head to cart!`,
      [
        { text: 'Keep Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => {} }
      ]
    );
  };

  const handleCallHudson = () => {
    const phoneNumber = '1-800-HUDSON';
    const telUrl = Platform.select({
      ios: `tel:${phoneNumber}`,
      android: `tel:${phoneNumber}`,
      web: `tel:${phoneNumber}`
    });
    
    if (telUrl) {
      Linking.canOpenURL(telUrl)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(telUrl);
          } else {
            Alert.alert(
              'Call Hudson',
              'Your Personal Home Director\n\n1-800-HUDSON\n(1-800-483-7661)',
              [{ text: 'OK', style: 'default' }]
            );
          }
        })
        .catch(() => {
          Alert.alert(
            'Call Hudson',
            'Your Personal Home Director\n\n1-800-HUDSON\n(1-800-483-7661)',
            [{ text: 'OK', style: 'default' }]
          );
        });
    }
  };

  const renderCallButton = () => (
    <TouchableOpacity 
      style={styles.callHudsonButton}
      onPress={handleCallHudson}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[COLORS.gold, COLORS.darkGold]}
        style={styles.callButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.callButtonContent}>
          <View style={styles.callIconContainer}>
            <Icons.Phone size={26} color="white" strokeWidth={2.5} />
          </View>
          <View style={styles.callTextContainer}>
            <Text style={styles.callButtonTitle}>Call Hudson</Text>
            <Text style={styles.callButtonSubtitle}>Your Personal Home Director</Text>
          </View>
          <View style={styles.callArrowContainer}>
            <Icons.ArrowRight size={20} color="white" strokeWidth={3} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderSubscriptionBanner = () => {
    if (!subscription || !nextVisit) return null;

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const completedTasks = nextVisit.tasks.filter(t => t.completed).length;
    const totalTasks = nextVisit.tasks.length;

    return (
      <View style={styles.subscriptionBanner}>
        <LinearGradient
          colors={['#1E3A5F', '#2C5282']}
          style={styles.subscriptionGradient}
        >
          <View style={styles.subscriptionHeader}>
            <View style={styles.subscriptionHeaderLeft}>
              <Icons.Award size={26} color={COLORS.gold} />
              <View>
                <Text style={styles.subscriptionTitle}>MyHome Subscription</Text>
                <Text style={styles.subscriptionSubtitle}>Active • ${subscription.monthlyPrice}/month</Text>
              </View>
            </View>
            {subscription.currentScore && (
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{subscription.currentScore.score}</Text>
              </View>
            )}
          </View>

          <View style={styles.nextVisitCard}>
            <View style={styles.nextVisitHeader}>
              <Icons.Calendar size={16} color={COLORS.gold} />
              <Text style={styles.nextVisitTitle}>Next Hudson Visit</Text>
            </View>
            <Text style={styles.nextVisitDate}>{formatDate(nextVisit.scheduledDate)}</Text>
            <View style={styles.visitProgress}>
              <View style={styles.visitProgressBar}>
                <View style={[styles.visitProgressFill, { width: `${(completedTasks / totalTasks) * 100}%` }]} />
              </View>
              <Text style={styles.visitProgressText}>{completedTasks}/{totalTasks} tasks</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.viewDetailsButton} onPress={() => router.push('/(tabs)/myhome')}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Icons.ArrowRight size={16} color="white" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  const getSeasonalInsights = () => {
    const month = new Date().getMonth();
    
    if (month >= 2 && month <= 4) {
      return {
        season: 'Spring',
        icon: 'Flower2',
        color: '#10B981',
        insights: [
          { text: 'Schedule gutter cleaning before spring rains', icon: 'Droplets' },
          { text: 'Power wash exterior surfaces', icon: 'Sparkles' },
          { text: 'Prepare lawn for growing season', icon: 'Trees' },
        ]
      };
    } else if (month >= 5 && month <= 7) {
      return {
        season: 'Summer',
        icon: 'Sun',
        color: '#F59E0B',
        insights: [
          { text: 'HVAC tune-up for cooling efficiency', icon: 'Wind' },
          { text: 'Pool maintenance and chemical balance', icon: 'Waves' },
          { text: 'Window washing for maximum light', icon: 'Square' },
        ]
      };
    } else if (month >= 8 && month <= 10) {
      return {
        season: 'Fall',
        icon: 'Leaf',
        color: '#D97706',
        insights: [
          { text: 'Chimney inspection before winter', icon: 'Home' },
          { text: 'Gutter cleaning for leaf season', icon: 'Droplets' },
          { text: 'Furnace tune-up preparation', icon: 'Flame' },
        ]
      };
    } else {
      return {
        season: 'Winter',
        icon: 'Snowflake',
        color: '#3B82F6',
        insights: [
          { text: 'Snow removal service ready', icon: 'Snowflake' },
          { text: 'Holiday lighting installation', icon: 'Lightbulb' },
          { text: 'Indoor air quality check', icon: 'Wind' },
        ]
      };
    }
  };

  const renderSeasonalInsights = () => {
    const seasonal = getSeasonalInsights();
    const SeasonIcon = getIconComponent(seasonal.icon);
    
    return (
      <View style={styles.seasonalSection}>
        <View style={styles.seasonalHeader}>
          <View style={styles.seasonalTitleRow}>
            <SeasonIcon size={20} color={seasonal.color} />
            <Text style={styles.seasonalTitle}>{seasonal.season} Home Care</Text>
          </View>
          <Text style={styles.seasonalSubtitle}>Proactive recommendations for your home</Text>
        </View>
        <View style={styles.insightsContainer}>
          {seasonal.insights.map((insight, index) => {
            const InsightIcon = getIconComponent(insight.icon);
            return (
              <View key={index} style={styles.seasonalInsightCard}>
                <View style={[styles.insightIconContainer, { backgroundColor: `${seasonal.color}15` }]}>
                  <InsightIcon size={18} color={seasonal.color} />
                </View>
                <Text style={styles.insightText}>{insight.text}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPopularServices = () => (
    <View style={styles.popularSection}>
      <View style={styles.sectionHeader}>
        <Icons.TrendingUp size={18} color={COLORS.teal} />
        <Text style={styles.sectionTitle}>Most Popular</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularScroll}>
        {popularServices.map((service) => (
          <TouchableOpacity 
            key={service.id} 
            style={styles.popularCard}
            onPress={() => router.push(`/service/${service.id}`)}
            activeOpacity={0.7}
          >
            <Image source={{ uri: service.image }} style={styles.popularImage} />
            <View style={styles.popularContent}>
              <Text style={styles.popularName} numberOfLines={2}>{service.name}</Text>
              <View style={styles.popularFooter}>
                <Text style={styles.popularPrice}>${service.price}</Text>
                <TouchableOpacity 
                  style={styles.popularButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleQuickAdd(service);
                  }}
                >
                  <Icons.Plus size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSortFilter = () => (
    <View style={styles.sortContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'popular', label: 'Most Popular', icon: 'TrendingUp' },
          { key: 'price-low', label: 'Price: Low to High', icon: 'ArrowUp' },
          { key: 'price-high', label: 'Price: High to Low', icon: 'ArrowDown' }
        ].map((sort) => {
          const IconComponent = getIconComponent(sort.icon);
          return (
            <TouchableOpacity
              key={sort.key}
              style={[
                styles.sortChip,
                sortBy === sort.key && styles.sortChipActive
              ]}
              onPress={() => setSortBy(sort.key as any)}
            >
              <IconComponent size={14} color={sortBy === sort.key ? 'white' : '#6B7280'} />
              <Text style={[
                styles.sortText,
                sortBy === sort.key && styles.sortTextActive
              ]}>
                {sort.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderHeroSection = () => (
    <View style={styles.heroSection}>
      <View style={styles.heroContent}>
        <Text style={styles.heroGreeting}>Welcome back,</Text>
        <Text style={styles.heroName}>{currentUser?.name || 'Homeowner'}</Text>
        <Text style={styles.heroSubtitle}>Your home deserves the best care</Text>
      </View>
      {renderCallButton()}
    </View>
  );

  const renderKeyInsights = () => {
    if (!property) return null;

    const getInsightIcon = (category: string) => {
      switch (category) {
        case 'hvac': return 'Wind';
        case 'plumbing': return 'Droplets';
        case 'electrical': return 'Zap';
        case 'appliance': return 'Refrigerator';
        case 'exterior': return 'Home';
        case 'landscaping': return 'Trees';
        default: return 'Info';
      }
    };

    const getInsightColor = (category: string) => {
      switch (category) {
        case 'hvac': return '#3B82F6';
        case 'plumbing': return '#06B6D4';
        case 'electrical': return '#F59E0B';
        case 'appliance': return '#8B5CF6';
        case 'exterior': return '#10B981';
        case 'landscaping': return '#22C55E';
        default: return COLORS.teal;
      }
    };

    const defaultInsights = [
      { category: 'hvac', title: 'HVAC Filter', value: 'Changed 2 weeks ago', status: 'good' },
      { category: 'plumbing', title: 'Water Pressure', value: 'Optimal', status: 'good' },
      { category: 'electrical', title: 'System Check', value: 'Due in 30 days', status: 'warning' },
      { category: 'exterior', title: 'Gutter Cleaning', value: 'Scheduled', status: 'good' },
    ];

    const displayInsights = insights.length > 0 ? insights.map(insight => ({
      category: insight.icon || 'hvac',
      title: insight.label,
      value: insight.lastUpdated,
      status: 'good',
    })) : defaultInsights;

    return (
      <View style={styles.insightsSection}>
        <View style={styles.insightsSectionHeader}>
          <View style={styles.insightsTitleRow}>
            <Icons.Activity size={22} color={COLORS.teal} strokeWidth={2.5} />
            <Text style={styles.insightsSectionTitle}>Property Insights</Text>
          </View>
          {property && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/myhome')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.insightsGrid}>
          {displayInsights.map((insight, index) => {
            const IconComponent = getIconComponent(getInsightIcon(insight.category));
            const color = getInsightColor(insight.category);
            return (
              <View key={index} style={styles.insightCard}>
                <View style={[styles.insightIconWrapper, { backgroundColor: `${color}15` }]}>
                  <IconComponent size={24} color={color} strokeWidth={2} />
                </View>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightValue}>{insight.value}</Text>
                <View style={[
                  styles.insightStatusDot,
                  { backgroundColor: insight.status === 'good' ? '#10B981' : insight.status === 'warning' ? '#F59E0B' : '#EF4444' }
                ]} />
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderUpcomingAppointments = () => {
    console.log('DEBUG renderUpcomingAppointments - appointmentsLoading:', appointmentsLoading);
    console.log('DEBUG renderUpcomingAppointments - length:', upcomingAppointments.length);
    console.log('DEBUG renderUpcomingAppointments - will render:', !(appointmentsLoading || upcomingAppointments.length === 0));
    
    if (appointmentsLoading || upcomingAppointments.length === 0) return null;

    return (
      <View style={styles.appointmentsSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Icons.Calendar size={24} color={COLORS.teal} />
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          </View>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => router.push('/appointments-list' as any)}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Icons.ChevronRight size={16} color={COLORS.teal} />
          </TouchableOpacity>
        </View>

        <View style={styles.appointmentsList}>
          {upcomingAppointments.map((apt) => {
            const appointmentDate = new Date(apt.scheduledDate);
            const today = new Date();
            const isToday = appointmentDate.toDateString() === today.toDateString();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const isTomorrow = appointmentDate.toDateString() === tomorrow.toDateString();

            let dateLabel = appointmentDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });
            if (isToday) dateLabel = 'Today';
            if (isTomorrow) dateLabel = 'Tomorrow';

            return (
              <TouchableOpacity
                key={apt.id}
                style={styles.appointmentCard}
                onPress={() => router.push(`/appointment/${apt.id}` as any)}
              >
                <View style={[
                  styles.appointmentIconContainer,
                  { backgroundColor: apt.type === 'snapshot-inspection' ? '#FEF3C7' : '#E0F2FE' }
                ]}>
                  {apt.type === 'snapshot-inspection' ? (
                    <Icons.Camera size={20} color="#B45309" />
                  ) : (
                    <Icons.Wrench size={20} color="#0369A1" />
                  )}
                </View>
                
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentProperty} numberOfLines={1}>
                    {apt.propertyName}
                  </Text>
                  <Text style={styles.appointmentType}>
                    {apt.type === 'snapshot-inspection' ? 'Snapshot Inspection' : 'Monthly Maintenance'}
                  </Text>
                  <View style={styles.appointmentMeta}>
                    <View style={styles.appointmentMetaItem}>
                      <Icons.Calendar size={12} color="#6B7280" />
                      <Text style={styles.appointmentMetaText}>{dateLabel}</Text>
                    </View>
                    <View style={styles.appointmentMetaItem}>
                      <Icons.User size={12} color="#6B7280" />
                      <Text style={styles.appointmentMetaText}>{apt.techName}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.appointmentArrow}>
                  <Icons.ChevronRight size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {renderHeroSection()}
      </SafeAreaView>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {renderSubscriptionBanner()}
        {renderKeyInsights()}
        {renderUpcomingAppointments()}

        <View style={styles.searchContainer}>
          <Icons.Search size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search premium home services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.scanButton}>
            <Icons.ScanLine size={20} color={COLORS.teal} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.servicesCategoriesContainer}
          contentContainerStyle={styles.servicesCategoriesContent}
        >
          {categories.map((category) => {
            const IconComponent = getIconComponent(category.icon);
            return (
              <TouchableOpacity
                key={category.name}
                style={[
                  styles.serviceCategoryChip,
                  selectedCategory === category.name && styles.serviceCategoryChipActive
                ]}
                onPress={() => setSelectedCategory(category.name)}
              >
                <IconComponent
                  size={16}
                  color={selectedCategory === category.name ? 'white' : '#6B7280'}
                />
                <Text style={[
                  styles.serviceCategoryText,
                  selectedCategory === category.name && styles.serviceCategoryTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {renderSeasonalInsights()}
        {renderPopularServices()}

        <View style={styles.servicesSection}>
          <View style={styles.servicesHeader}>
            <Text style={styles.servicesTitle}>All Services</Text>
            <Text style={styles.servicesCount}>{filteredServices.length} available</Text>
          </View>

          {renderSortFilter()}

          <View style={styles.servicesGrid}>
            {filteredServices.map((service) => (
              <View key={service.id} style={styles.cardContainer}>
                <ServiceCard service={service} onQuickAdd={() => handleQuickAdd(service)} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.teal,
  },
  safeArea: {
    backgroundColor: COLORS.teal,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  heroContent: {
    marginBottom: 20,
  },
  heroGreeting: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  heroName: {
    fontSize: 34,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  insightsSection: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  insightsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.teal,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  insightCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    position: 'relative',
  },
  insightIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: -0.2,
  },
  insightStatusDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  seasonalSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  seasonalHeader: {
    marginBottom: 16,
  },
  seasonalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  seasonalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: -0.3,
  },
  seasonalSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginLeft: 28,
  },
  insightsContainer: {
    gap: 10,
  },
  seasonalInsightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.background.secondary,
    padding: 12,
    borderRadius: 12,
  },
  insightIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  popularSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: -0.3,
  },
  popularScroll: {
    paddingLeft: 20,
  },
  popularCard: {
    width: 160,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  popularImage: {
    width: '100%',
    height: 100,
  },
  popularContent: {
    padding: 12,
  },
  popularName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    lineHeight: 18,
    minHeight: 36,
  },
  popularFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  popularPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.teal,
    letterSpacing: -0.3,
  },
  popularButton: {
    backgroundColor: COLORS.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicesSection: {
    marginTop: 8,
    paddingBottom: 24,
  },
  sortContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  sortChipActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  sortText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortTextActive: {
    color: 'white',
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: -0.3,
  },
  servicesCount: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 18,
    borderRadius: 24,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  scanButton: {
    padding: 8,
    marginLeft: 8,
  },
  servicesCategoriesContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  servicesCategoriesContent: {
    paddingHorizontal: 20,
  },
  serviceCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  serviceCategoryChipActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  serviceCategoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  serviceCategoryTextActive: {
    color: 'white',
  },
  cardContainer: {
    width: '48%',
    marginBottom: 4,
  },
  callHudsonButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  callButtonGradient: {
    padding: 18,
  },
  callButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  callIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  callTextContainer: {
    flex: 1,
  },
  callButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  callButtonSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
  },
  callArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subscriptionGradient: {
    padding: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  subscriptionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
  },
  nextVisitCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  nextVisitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  nextVisitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  nextVisitDate: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gold,
    marginBottom: 10,
  },
  visitProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  visitProgressBar: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  visitProgressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 3,
  },
  visitProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 10,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  appointmentsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.teal,
  },
  appointmentsList: {
    gap: 12,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  appointmentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentInfo: {
    flex: 1,
    gap: 4,
  },
  appointmentProperty: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  appointmentType: {
    fontSize: 13,
    color: '#6B7280',
  },
  appointmentMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  appointmentMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appointmentMetaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  appointmentArrow: {
    padding: 4,
  },
});