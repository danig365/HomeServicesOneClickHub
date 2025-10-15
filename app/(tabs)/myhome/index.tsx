import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Linking,
  TextInput,
} from "react-native";
import * as Icons from "lucide-react-native";
import { useProperties } from "@/hooks/properties-store";
import { useUser } from "@/hooks/user-store";
import { PropertyInsight} from "@/types/property";
import { useSubscription } from "@/hooks/subscription-store";
import { useBookings } from "@/hooks/bookings-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { router } from "expo-router";

export default function MyHomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    properties,
    getSelectedProperty,
    selectProperty,
    addInsight,
    updateInsight,
    deleteInsight,
    getUpcomingReminders,
    getOverdueReminders,
    refreshProperties,
  } = useProperties();
  const { currentUser } = useUser();
  const { getSubscription, createSubscription, getNextVisit, getRecentVisits } =
    useSubscription();
  const { recurringServices, updateRecurringService } = useBookings();
  const property = getSelectedProperty();
  const subscription = property ? getSubscription(property.id) : null;
  const nextVisit = property && subscription ? getNextVisit(property.id) : null;
  const recentVisits =
    property && subscription ? getRecentVisits(property.id, 3) : [];

  const [showPropertySelector, setShowPropertySelector] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [editingInsight, setEditingInsight] = useState<PropertyInsight | null>(
    null
  );
  const [insightForm, setInsightForm] = useState({
    label: "",
    lastUpdated: new Date().toISOString(),
    icon: "Wind",
    color: "#60A5FA",
    recommendedInterval: 90,
    notes: "",
  });

  useEffect(() => {
    if (!properties?.length) {
      refreshProperties();
    }
  }, [properties, refreshProperties]);

  useEffect(() => {
    if (property && !subscription) {
      createSubscription(property.id);
    }
  }, [property, subscription, createSubscription]);

  if (!property) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Icons.Home size={64} color={COLORS.text.light} />
          <Text style={styles.emptyTitle}>No Property Selected</Text>
          <Text style={styles.emptyText}>
            Please select a property to view your smart home
          </Text>
        </View>
      </View>
    );
  }

  if (!subscription) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Icons.Loader size={48} color={COLORS.teal} />
          <Text style={styles.emptyText}>Loading subscription...</Text>
        </View>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handlePropertyChange = (propertyId: string) => {
    selectProperty(propertyId);
    setShowPropertySelector(false);
  };

  const handleReschedule = (service: any) => {
    setSelectedService(service);
    setShowRescheduleModal(true);
  };

  const confirmReschedule = (newDate: string) => {
    if (selectedService) {
      updateRecurringService(selectedService.id, { nextServiceDate: newDate });
      Alert.alert("Success", "Service rescheduled successfully");
      setShowRescheduleModal(false);
      setSelectedService(null);
    }
  };

  const getLastMaintenanceDate = (taskName: string) => {
    const allVisits = subscription?.visits || [];
    for (const visit of allVisits.slice().reverse()) {
      if (visit.status === "completed") {
        const task = visit.tasks.find((t) =>
          t.name.toLowerCase().includes(taskName.toLowerCase())
        );
        if (task && task.completed) {
          return formatDate(visit.completedDate!);
        }
      }
    }
    return "Not recorded";
  };

  const getDaysSince = (dateString: string) => {
    if (dateString === "Not recorded") return null;
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  };

  const propertyRecurringServices = recurringServices.filter(
    (s) => s.propertyId === property.id && s.status === "active"
  );

  const defaultInsights = [
    {
      icon: Icons.Wind,
      label: "HVAC Filter",
      lastCleaned: getLastMaintenanceDate("hvac filter"),
      color: "#60A5FA",
      recommended: 90,
    },
    {
      icon: Icons.Droplet,
      label: "Water Heater",
      lastCleaned: getLastMaintenanceDate("water heater"),
      color: "#3B82F6",
      recommended: 180,
    },
    {
      icon: Icons.Zap,
      label: "Electrical Panel",
      lastCleaned: getLastMaintenanceDate("electrical"),
      color: "#FCD34D",
      recommended: 365,
    },
    {
      icon: Icons.Home,
      label: "Gutter Cleaning",
      lastCleaned: getLastMaintenanceDate("gutter"),
      color: "#10B981",
      recommended: 180,
    },
  ];

  const customInsights = property?.insights || [];
  const maintenanceInsights = [
    ...defaultInsights,
    ...customInsights.map((insight) => ({
      icon: getIconComponent(insight.icon),
      label: insight.label,
      lastCleaned: formatDate(insight.lastUpdated),
      color: insight.color,
      recommended: insight.recommendedInterval || 90,
      id: insight.id,
      notes: insight.notes,
      isCustom: true,
    })),
  ];

  function getIconComponent(iconName: string) {
    const iconMap: Record<string, any> = {
      Wind: Icons.Wind,
      Droplet: Icons.Droplet,
      Zap: Icons.Zap,
      Home: Icons.Home,
      Wrench: Icons.Wrench,
      Hammer: Icons.Hammer,
      Paintbrush: Icons.Paintbrush,
      Thermometer: Icons.Thermometer,
      Lightbulb: Icons.Lightbulb,
      Flame: Icons.Flame,
      Snowflake: Icons.Snowflake,
      Fan: Icons.Fan,
      Gauge: Icons.Gauge,
    };
    return iconMap[iconName] || Icons.Home;
  }

  const setEditingInsightWithCorrectType = (insight: PropertyInsight) => {
    setEditingInsight({
      id: insight.id,
      property_id: insight.property_id,
      label: insight.label,
      last_updated: insight.last_updated,
      icon: insight.icon,
      color: insight.color,
      recommended_interval: insight.recommended_interval,
      notes: insight.notes,
      updated_by: insight.updated_by,
      updated_by_role: insight.updated_by_role,
      created_at: insight.created_at,
      updated_at: insight.updated_at,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerSection, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={styles.propertySelector}
            onPress={() => setShowPropertySelector(true)}
          >
            <View style={styles.propertySelectorLeft}>
              <Icons.Home size={24} color={COLORS.teal} />
              <View>
                <Text style={styles.propertyLabel}>Current Property</Text>
                <Text style={styles.propertyName}>{property.name}</Text>
              </View>
            </View>
            <Icons.ChevronDown size={24} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.blueprintSection}>
          {subscription.blueprint ? (
            <TouchableOpacity
              style={styles.blueprintCard}
              onPress={() => router.push("/blueprint")}
              activeOpacity={0.7}
            >
              <View style={styles.blueprintHeader}>
                <View style={styles.blueprintIconWrapper}>
                  <Icons.FileText size={28} color={COLORS.gold} />
                </View>
                <View style={styles.blueprintInfo}>
                  <Text style={styles.blueprintTitle}>MyHome Blueprint</Text>
                  <Text style={styles.blueprintSubtitle}>
                    Your 5-Year Home Plan
                  </Text>
                </View>
                <Icons.ChevronRight size={24} color={COLORS.text.secondary} />
              </View>
              <View style={styles.blueprintStats}>
                <View style={styles.blueprintStat}>
                  <Icons.Target size={16} color={COLORS.teal} />
                  <Text style={styles.blueprintStatText}>
                    {subscription.blueprint.fiveYearGoals.length} Goals
                  </Text>
                </View>
                <View style={styles.blueprintStat}>
                  <Icons.Briefcase size={16} color={COLORS.teal} />
                  <Text style={styles.blueprintStatText}>
                    {subscription.blueprint.customProjects?.length || 0}{" "}
                    Projects
                  </Text>
                </View>
                <View style={styles.blueprintStat}>
                  <Icons.ListChecks size={16} color={COLORS.teal} />
                  <Text style={styles.blueprintStatText}>
                    {subscription.blueprint.monthlyVisitRequests?.length || 0}/5
                    Requests
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.blueprintEmptyCard}
              onPress={() => router.push("/blueprint")}
              activeOpacity={0.7}
            >
              <View style={styles.blueprintEmptyIcon}>
                <Icons.FileText size={40} color={COLORS.gold} />
              </View>
              <Text style={styles.blueprintEmptyTitle}>
                Create Your Blueprint
              </Text>
              <Text style={styles.blueprintEmptyText}>
                Start your 5-year home improvement plan to help us personalize
                your maintenance
              </Text>
              <View style={styles.blueprintEmptyButton}>
                <Text style={styles.blueprintEmptyButtonText}>Get Started</Text>
                <Icons.ArrowRight size={18} color="white" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.scoreSection}>
          <View style={styles.scoreSectionHeader}>
            <Text style={styles.sectionTitle}>Home Score</Text>
            {subscription.currentScore && (
              <Text style={styles.scoreQuarter}>
                {subscription.currentScore.quarter}{" "}
                {subscription.currentScore.year}
              </Text>
            )}
          </View>

          {subscription.currentScore ? (
            <View style={styles.scoreCard}>
              <View style={styles.scoreMainWrapper}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreMainValue}>
                    {subscription.currentScore.score}
                  </Text>
                  <Text style={styles.scoreMainLabel}>Overall</Text>
                </View>
                <View style={styles.scoreDescription}>
                  <Text style={styles.scoreDescriptionTitle}>
                    Excellent Condition
                  </Text>
                  <Text style={styles.scoreDescriptionText}>
                    Your home is well-maintained and in great shape
                  </Text>
                </View>
              </View>

              <View style={styles.scoreDivider} />

              <View style={styles.categoriesGrid}>
                {Object.entries(subscription.currentScore.categories).map(
                  ([key, value]) => {
                    const categoryIcons: Record<string, any> = {
                      structural: Icons.Home,
                      mechanical: Icons.Settings,
                      aesthetic: Icons.Sparkles,
                      efficiency: Icons.Zap,
                      safety: Icons.Shield,
                    };
                    const Icon = categoryIcons[key];
                    const categoryColor =
                      value >= 90
                        ? "#10B981"
                        : value >= 80
                        ? "#F59E0B"
                        : "#EF4444";

                    return (
                      <View key={key} style={styles.categoryItem}>
                        <View
                          style={[
                            styles.categoryIconWrapper,
                            { backgroundColor: `${categoryColor}15` },
                          ]}
                        >
                          <Icon size={18} color={categoryColor} />
                        </View>
                        <Text style={styles.categoryLabel}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Text>
                        <Text
                          style={[
                            styles.categoryValue,
                            { color: categoryColor },
                          ]}
                        >
                          {value}
                        </Text>
                      </View>
                    );
                  }
                )}
              </View>

              {subscription.currentScore.improvements.length > 0 && (
                <View style={styles.scoreDetailSection}>
                  <View style={styles.scoreDetailHeader}>
                    <Icons.TrendingUp
                      size={18}
                      color={COLORS.accentColors.success}
                    />
                    <Text style={styles.scoreDetailTitle}>
                      Recent Improvements
                    </Text>
                  </View>
                  {subscription.currentScore.improvements.map(
                    (improvement, idx) => (
                      <View key={idx} style={styles.scoreDetailItem}>
                        <Icons.CheckCircle
                          size={14}
                          color={COLORS.accentColors.success}
                        />
                        <Text style={styles.scoreDetailText}>
                          {improvement}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              )}

              {subscription.currentScore.recommendations.length > 0 && (
                <View style={styles.scoreDetailSection}>
                  <View style={styles.scoreDetailHeader}>
                    <Icons.Lightbulb size={18} color={COLORS.gold} />
                    <Text style={styles.scoreDetailTitle}>Recommendations</Text>
                  </View>
                  {subscription.currentScore.recommendations.map((rec, idx) => (
                    <View key={idx} style={styles.scoreDetailItem}>
                      <Icons.ArrowRight size={14} color={COLORS.gold} />
                      <Text style={styles.scoreDetailText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.scoreEmptyCard}>
              <Icons.Award size={48} color={COLORS.text.light} />
              <Text style={styles.scoreEmptyText}>
                Score will be available after your first visit
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Property Insights</Text>
            <TouchableOpacity
              style={styles.addInsightButton}
              onPress={() => {
                setEditingInsight(null);
                setInsightForm({
                  label: "",
                  lastUpdated: new Date().toISOString(),
                  icon: "Wind",
                  color: "#60A5FA",
                  recommendedInterval: 90,
                  notes: "",
                });
                setShowInsightModal(true);
              }}
            >
              <Icons.Plus size={18} color={COLORS.teal} />
              <Text style={styles.addInsightText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.insightsGrid}>
            {maintenanceInsights.map((insight, index) => {
              const Icon = insight.icon;
              const daysSince = getDaysSince(insight.lastCleaned);
              const isOverdue =
                daysSince !== null && daysSince > insight.recommended;
              const isCustom = (insight as any).isCustom;

              return (
                <TouchableOpacity
                  key={(insight as any).id || index}
                  style={styles.insightCard}
                  onPress={() => {
                    if (isCustom && property) {
                      const customInsight = property.insights?.find(
                        (i) => i.id === (insight as any).id
                      );
                      if (customInsight) {
                        setEditingInsightWithCorrectType(customInsight);
                        setInsightForm({
                          label: customInsight.label,
                          lastUpdated: customInsight.lastUpdated,
                          icon: customInsight.icon,
                          color: customInsight.color,
                          recommendedInterval:
                            customInsight.recommendedInterval || 90,
                          notes: customInsight.notes || "",
                        });
                        setShowInsightModal(true);
                      }
                    }
                  }}
                  disabled={!isCustom}
                >
                  <View
                    style={[
                      styles.insightIconWrapper,
                      { backgroundColor: `${insight.color}20` },
                    ]}
                  >
                    <Icon size={20} color={insight.color} />
                  </View>
                  <Text style={styles.insightLabel}>{insight.label}</Text>
                  <Text style={styles.insightDate}>{insight.lastCleaned}</Text>
                  {daysSince !== null && (
                    <View
                      style={[
                        styles.insightBadge,
                        isOverdue && styles.insightBadgeOverdue,
                      ]}
                    >
                      <Text
                        style={[
                          styles.insightBadgeText,
                          isOverdue && styles.insightBadgeTextOverdue,
                        ]}
                      >
                        {daysSince} days ago
                      </Text>
                    </View>
                  )}
                  {isCustom && (
                    <View style={styles.customBadge}>
                      <Text style={styles.customBadgeText}>Custom</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {nextVisit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Hudson Visit</Text>
            <View style={styles.nextVisitCard}>
              <View style={styles.nextVisitHeader}>
                <View style={styles.nextVisitDate}>
                  <Icons.Calendar size={20} color={COLORS.gold} />
                  <Text style={styles.nextVisitDateText}>
                    {formatDate(nextVisit.scheduledDate)}
                  </Text>
                </View>
                <View style={styles.nextVisitBadge}>
                  <Icons.Clock size={14} color="#0D9488" />
                  <Text style={styles.nextVisitBadgeText}>Scheduled</Text>
                </View>
              </View>

              <View style={styles.nextVisitHudson}>
                {subscription.personalDirector?.photo ? (
                  <Image
                    source={{ uri: subscription.personalDirector.photo }}
                    style={styles.hudsonPhoto}
                  />
                ) : (
                  <View
                    style={[styles.hudsonPhoto, styles.hudsonPhotoPlaceholder]}
                  >
                    <Icons.User size={24} color={COLORS.text.secondary} />
                  </View>
                )}
                <View style={styles.hudsonInfo}>
                  <Text style={styles.hudsonName}>{nextVisit.hudsonName}</Text>
                  <Text style={styles.hudsonRole}>
                    Your Personal Home Director
                  </Text>
                </View>
              </View>

              <View style={styles.nextVisitTasks}>
                <Text style={styles.nextVisitTasksTitle}>
                  {nextVisit.tasks.length} tasks scheduled
                </Text>
                {nextVisit.tasks.slice(0, 3).map((task) => (
                  <View key={task.id} style={styles.taskPreviewItem}>
                    <Icons.CheckCircle size={16} color="#9CA3AF" />
                    <Text style={styles.taskPreviewText}>{task.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {propertyRecurringServices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recurring Appointments</Text>
            {propertyRecurringServices.map((service) => (
              <View key={service.id} style={styles.recurringCard}>
                <View style={styles.recurringHeader}>
                  <View style={styles.recurringLeft}>
                    <Icons.RefreshCw size={20} color="#60A5FA" />
                    <View>
                      <Text style={styles.recurringName}>
                        {service.serviceName}
                      </Text>
                      <Text style={styles.recurringFrequency}>
                        {service.frequency}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.rescheduleButton}
                    onPress={() => handleReschedule(service)}
                  >
                    <Icons.Calendar size={16} color={COLORS.gold} />
                    <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.recurringFooter}>
                  <View style={styles.recurringDate}>
                    <Icons.Clock size={14} color="#6B7280" />
                    <Text style={styles.recurringDateText}>
                      Next: {formatDate(service.nextServiceDate)}
                    </Text>
                  </View>
                  <Text style={styles.recurringPrice}>${service.price}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {recentVisits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Maintenance</Text>
            {recentVisits.map((visit) => (
              <View key={visit.id} style={styles.recentVisitCard}>
                <View style={styles.recentVisitHeader}>
                  <Icons.CheckCircle size={20} color="#10B981" />
                  <Text style={styles.recentVisitDate}>
                    {formatDate(visit.completedDate!)}
                  </Text>
                </View>
                <Text style={styles.recentVisitTasks}>
                  {visit.tasks.length} tasks completed
                </Text>
                {visit.notes && (
                  <Text style={styles.recentVisitNotes} numberOfLines={2}>
                    {visit.notes}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {property &&
          (getUpcomingReminders(property.id).length > 0 ||
            getOverdueReminders(property.id).length > 0) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Property Reminders</Text>
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => router.push("/property-reminders")}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <Icons.ChevronRight size={16} color={COLORS.teal} />
                </TouchableOpacity>
              </View>
              {property &&
                (getUpcomingReminders(property.id).length > 0 ||
                  getOverdueReminders(property.id).length > 0) && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>
                        Property Reminders
                      </Text>
                      <TouchableOpacity
                        style={styles.viewAllButton}
                        onPress={() => router.push("/property-reminders")}
                      >
                        <Text style={styles.viewAllText}>View All</Text>
                        <Icons.ChevronRight size={16} color={COLORS.teal} />
                      </TouchableOpacity>
                    </View>
                    {getOverdueReminders(property.id)
                      .slice(0, 2)
                      .map((reminder) => (
                        <View
                          key={reminder.id}
                          style={[
                            styles.reminderPreviewCard,
                            styles.reminderOverdue,
                          ]}
                        >
                          <View style={styles.reminderPreviewHeader}>
                            <Icons.AlertCircle
                              size={18}
                              color={COLORS.accentColors.error}
                            />
                            <Text style={styles.reminderPreviewTitle}>
                              {reminder.title}
                            </Text>
                          </View>
                          <Text style={styles.reminderPreviewDate}>
                            Due: {formatDate(reminder.dueDate)} (Overdue)
                          </Text>
                        </View>
                      ))}
                    {getUpcomingReminders(property.id)
                      .slice(0, 2)
                      .map((reminder) => (
                        <View
                          key={reminder.id}
                          style={styles.reminderPreviewCard}
                        >
                          <View style={styles.reminderPreviewHeader}>
                            <Icons.Bell size={18} color={COLORS.teal} />
                            <Text style={styles.reminderPreviewTitle}>
                              {reminder.title}
                            </Text>
                          </View>
                          <Text style={styles.reminderPreviewDate}>
                            Due: {formatDate(reminder.dueDate)}
                          </Text>
                        </View>
                      ))}
                  </View>
                )}
            </View>
          )}
      </ScrollView>

      <Modal
        visible={showPropertySelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPropertySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Property</Text>
              <TouchableOpacity onPress={() => setShowPropertySelector(false)}>
                <Icons.X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {properties.map((prop) => (
                <TouchableOpacity
                  key={prop.id}
                  style={[
                    styles.propertyOption,
                    prop.id === property.id && styles.propertyOptionSelected,
                  ]}
                  onPress={() => handlePropertyChange(prop.id)}
                >
                  <View style={styles.propertyOptionLeft}>
                    <Icons.Home
                      size={24}
                      color={prop.id === property.id ? COLORS.gold : "#6B7280"}
                    />
                    <View>
                      <Text
                        style={[
                          styles.propertyOptionName,
                          prop.id === property.id &&
                            styles.propertyOptionNameSelected,
                        ]}
                      >
                        {prop.name}
                      </Text>
                      <Text style={styles.propertyOptionAddress}>
                        {prop.address}, {prop.city}
                      </Text>
                    </View>
                  </View>
                  {prop.id === property.id && (
                    <Icons.Check size={24} color={COLORS.gold} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRescheduleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Service</Text>
              <TouchableOpacity onPress={() => setShowRescheduleModal(false)}>
                <Icons.X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.rescheduleContent}>
              <Text style={styles.rescheduleServiceName}>
                {selectedService?.serviceName}
              </Text>
              <Text style={styles.rescheduleCurrentDate}>
                Current:{" "}
                {selectedService && formatDate(selectedService.nextServiceDate)}
              </Text>

              <View style={styles.rescheduleOptions}>
                <TouchableOpacity
                  style={styles.rescheduleOption}
                  onPress={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    confirmReschedule(nextWeek.toISOString());
                  }}
                >
                  <Icons.Calendar size={20} color="#60A5FA" />
                  <Text style={styles.rescheduleOptionText}>Next Week</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rescheduleOption}
                  onPress={() => {
                    const twoWeeks = new Date();
                    twoWeeks.setDate(twoWeeks.getDate() + 14);
                    confirmReschedule(twoWeeks.toISOString());
                  }}
                >
                  <Icons.Calendar size={20} color="#60A5FA" />
                  <Text style={styles.rescheduleOptionText}>In 2 Weeks</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rescheduleOption}
                  onPress={() => {
                    const nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    confirmReschedule(nextMonth.toISOString());
                  }}
                >
                  <Icons.Calendar size={20} color="#60A5FA" />
                  <Text style={styles.rescheduleOptionText}>Next Month</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => {
                  setShowRescheduleModal(false);
                  Alert.alert(
                    "Contact Hudson",
                    "Call your Hudson Director for custom scheduling?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Call",
                        onPress: () => {
                          if (subscription?.personalDirector.phone) {
                            Linking.openURL(
                              `tel:${subscription.personalDirector.phone}`
                            );
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Icons.Phone size={20} color={COLORS.gold} />
                <Text style={styles.contactButtonText}>
                  Contact Hudson for Custom Date
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showInsightModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInsightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingInsight ? "Edit Insight" : "Add Property Insight"}
              </Text>
              <TouchableOpacity onPress={() => setShowInsightModal(false)}>
                <Icons.X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Label</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Pool Filter"
                  value={insightForm.label}
                  onChangeText={(text) =>
                    setInsightForm({ ...insightForm, label: text })
                  }
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Last Updated Date</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD"
                  value={insightForm.lastUpdated.split("T")[0]}
                  onChangeText={(text) =>
                    setInsightForm({
                      ...insightForm,
                      lastUpdated: text + "T00:00:00.000Z",
                    })
                  }
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Icon</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.iconSelector}
                >
                  {[
                    "Wind",
                    "Droplet",
                    "Zap",
                    "Home",
                    "Wrench",
                    "Hammer",
                    "Paintbrush",
                    "Thermometer",
                    "Lightbulb",
                    "Flame",
                    "Snowflake",
                    "Fan",
                    "Gauge",
                  ].map((iconName) => {
                    const IconComponent = getIconComponent(iconName);
                    return (
                      <TouchableOpacity
                        key={iconName}
                        style={[
                          styles.iconOption,
                          insightForm.icon === iconName &&
                            styles.iconOptionSelected,
                        ]}
                        onPress={() =>
                          setInsightForm({ ...insightForm, icon: iconName })
                        }
                      >
                        <IconComponent
                          size={24}
                          color={
                            insightForm.icon === iconName
                              ? COLORS.teal
                              : "#6B7280"
                          }
                        />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Color</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.colorSelector}
                >
                  {[
                    "#60A5FA",
                    "#3B82F6",
                    "#FCD34D",
                    "#10B981",
                    "#EF4444",
                    "#8B5CF6",
                    "#EC4899",
                    "#F97316",
                  ].map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        insightForm.color === color &&
                          styles.colorOptionSelected,
                      ]}
                      onPress={() => setInsightForm({ ...insightForm, color })}
                    />
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>
                  Recommended Interval (days)
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="90"
                  keyboardType="numeric"
                  value={insightForm.recommendedInterval?.toString()}
                  onChangeText={(text) =>
                    setInsightForm({
                      ...insightForm,
                      recommendedInterval: parseInt(text) || 90,
                    })
                  }
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Additional notes..."
                  multiline
                  numberOfLines={4}
                  value={insightForm.notes}
                  onChangeText={(text) =>
                    setInsightForm({ ...insightForm, notes: text })
                  }
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalActions}>
                {editingInsight && (
                  <TouchableOpacity
                    style={styles.deleteInsightButton}
                    onPress={() => {
                      Alert.alert(
                        "Delete Insight",
                        "Are you sure you want to delete this insight?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: async () => {
                              if (property && editingInsight) {
                                await deleteInsight(
                                  property.id,
                                  editingInsight.id
                                );
                                setShowInsightModal(false);
                                Alert.alert(
                                  "Success",
                                  "Insight deleted successfully"
                                );
                              }
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Icons.Trash2 size={20} color="white" />
                    <Text style={styles.deleteInsightButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.saveInsightButton}
                  onPress={async () => {
                    if (!property || !insightForm.label) {
                      Alert.alert(
                        "Error",
                        "Please fill in all required fields"
                      );
                      return;
                    }

                    const insightData = {
                      label: insightForm.label,
                      last_updated: insightForm.lastUpdated,
                      icon: insightForm.icon,
                      color: insightForm.color,
                      recommended_interval: insightForm.recommendedInterval,
                      notes: insightForm.notes,
                      updated_by: currentUser?.name,
                      updated_by_role: currentUser?.role,
                    };

                    if (editingInsight) {
                      await updateInsight(
                        property.id,
                        editingInsight.id,
                        insightData
                      );
                      Alert.alert("Success", "Insight updated successfully");
                    } else {
                      await addInsight(property.id, insightData);
                      Alert.alert("Success", "Insight added successfully");
                    }
                    setShowInsightModal(false);
                  }}
                >
                  <Icons.Save size={20} color="white" />
                  <Text style={styles.saveInsightButtonText}>
                    {editingInsight ? "Update" : "Add"} Insight
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: "center" as const,
  },
  headerSection: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.cream,
  },
  propertySelector: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.teal,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  propertySelectorLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  propertyLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: COLORS.text.primary,
  },
  statsGrid: {
    flexDirection: "row" as const,
    gap: 12,
  },
  blueprintSection: {
    padding: 16,
    paddingTop: 0,
  },
  blueprintCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.gold,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  blueprintHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  blueprintIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  },
  blueprintInfo: {
    flex: 1,
  },
  blueprintTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  blueprintSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  blueprintStats: {
    flexDirection: "row" as const,
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.secondary,
  },
  blueprintStat: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  blueprintStatText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: COLORS.text.secondary,
  },
  blueprintEmptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 32,
    alignItems: "center" as const,
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderStyle: "dashed" as const,
  },
  blueprintEmptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  blueprintEmptyTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  blueprintEmptyText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: "center" as const,
    lineHeight: 22,
    marginBottom: 20,
  },
  blueprintEmptyButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  blueprintEmptyButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "white",
  },
  scoreSection: {
    padding: 16,
  },
  scoreSectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  scoreQuarter: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text.secondary,
  },
  scoreCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  scoreMainWrapper: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 24,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 4,
    borderColor: COLORS.gold,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 20,
  },
  scoreMainValue: {
    fontSize: 36,
    fontWeight: "900" as const,
    color: COLORS.gold,
  },
  scoreMainLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  scoreDescription: {
    flex: 1,
  },
  scoreDescriptionTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  scoreDescriptionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  scoreDivider: {
    height: 1,
    backgroundColor: COLORS.background.secondary,
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
    marginBottom: 20,
  },
  categoryItem: {
    width: "48%",
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  categoryIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: COLORS.text.secondary,
  },
  categoryValue: {
    fontSize: 24,
    fontWeight: "800" as const,
  },
  scoreDetailSection: {
    marginBottom: 16,
  },
  scoreDetailHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 12,
  },
  scoreDetailTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: COLORS.text.primary,
  },
  scoreDetailItem: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 8,
    marginBottom: 8,
  },
  scoreDetailText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  scoreEmptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 40,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
  },
  scoreEmptyText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 12,
    textAlign: "center" as const,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: COLORS.text.primary,
  },
  addInsightButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.teal,
  },
  addInsightText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.teal,
  },
  insightsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  insightCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 12,
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  insightDate: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  insightBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start" as const,
  },
  insightBadgeOverdue: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  insightBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: COLORS.accentColors.success,
  },
  insightBadgeTextOverdue: {
    color: COLORS.accentColors.error,
  },
  customBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start" as const,
    marginTop: 4,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: COLORS.gold,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
  },
  formTextArea: {
    minHeight: 100,
  },
  iconSelector: {
    flexDirection: "row" as const,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.background.secondary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconOptionSelected: {
    borderColor: COLORS.teal,
    backgroundColor: "rgba(13, 148, 136, 0.1)",
  },
  colorSelector: {
    flexDirection: "row" as const,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: COLORS.text.primary,
  },
  modalActions: {
    flexDirection: "row" as const,
    gap: 12,
    marginTop: 10,
  },
  deleteInsightButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: COLORS.accentColors.error,
    padding: 16,
    borderRadius: 12,
  },
  deleteInsightButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "white",
  },
  saveInsightButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: COLORS.teal,
    padding: 16,
    borderRadius: 12,
  },
  saveInsightButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "white",
  },
  nextVisitCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.gold,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  nextVisitHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  nextVisitDate: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  nextVisitDateText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: COLORS.text.primary,
  },
  nextVisitBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: "rgba(90, 127, 127, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  nextVisitBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: COLORS.teal,
  },
  nextVisitHudson: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
    marginBottom: 16,
  },
  hudsonPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  hudsonPhotoPlaceholder: {
    backgroundColor: COLORS.background.secondary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  hudsonInfo: {
    flex: 1,
  },
  hudsonName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: COLORS.text.primary,
  },
  hudsonRole: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  nextVisitTasks: {
    gap: 8,
  },
  nextVisitTasksTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  taskPreviewItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  taskPreviewText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  recurringCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recurringHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  recurringLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    flex: 1,
  },
  recurringName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
  },
  recurringFrequency: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
    textTransform: "capitalize" as const,
  },
  rescheduleButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rescheduleButtonText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: COLORS.gold,
  },
  recurringFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  recurringDate: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  recurringDateText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  recurringPrice: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: COLORS.gold,
  },
  recentVisitCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recentVisitHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 8,
  },
  recentVisitDate: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
  },
  recentVisitTasks: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  recentVisitNotes: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  viewAllButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.teal,
  },
  reminderPreviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
  },
  reminderOverdue: {
    borderColor: COLORS.accentColors.error,
    borderWidth: 2,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  reminderPreviewHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 6,
  },
  reminderPreviewTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
    flex: 1,
  },
  reminderPreviewDate: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginLeft: 26,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: COLORS.text.primary,
  },
  modalScroll: {
    padding: 20,
  },
  propertyOption: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 16,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
  },
  propertyOptionSelected: {
    borderColor: COLORS.gold,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  propertyOptionLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    flex: 1,
  },
  propertyOptionName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
  },
  propertyOptionNameSelected: {
    color: COLORS.gold,
  },
  propertyOptionAddress: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  rescheduleContent: {
    padding: 20,
  },
  rescheduleServiceName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  rescheduleCurrentDate: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 24,
  },
  rescheduleOptions: {
    gap: 12,
    marginBottom: 24,
  },
  rescheduleOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    backgroundColor: COLORS.background.secondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.teal,
  },
  rescheduleOptionText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
  },
  contactButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.gold,
  },
});
