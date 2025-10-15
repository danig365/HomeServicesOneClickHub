import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  User,
  Home,
  CreditCard,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Award,
} from "lucide-react-native";
import { useBookings } from "@/hooks/bookings-store";
import { useProperties } from "@/hooks/properties-store";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/hooks/auth-store";

export default function ProfileScreen() {
  const router = useRouter();
  const { bookings } = useBookings();
  const { properties } = useProperties();
  const { user, logout } = useAuth();
  const completedCount = bookings.filter(
    (b) => b.status === "completed"
  ).length;

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: Home,
      label: "My Properties",
      onPress: () => router.push("/properties"),
    },
    {
      icon: Award,
      label: "Exclusive Referral Card",
      onPress: () => router.push("/referral-card"),
      highlight: true,
    },
    { icon: CreditCard, label: "Payment Methods", onPress: () => {} },
    { icon: Bell, label: "Notifications", onPress: () => {} },
    { icon: Shield, label: "Privacy & Security", onPress: () => {} },
  ];

  const techMenuItem = [
    {
      icon: User,
      label: "Tech Portal",
      onPress: () => router.push("/tech-portal"),
    },
  ];

  const adminMenuItem = [
    {
      icon: Shield,
      label: "Admin Portal",
      onPress: () => router.push("/admin-portal"),
      highlight: true,
    },
    { icon: LogOut, label: "Logout", onPress: handleLogout, isLogout: true },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <User size={40} color="white" />
        </View>
        <Text style={styles.name}>{user?.name || "Guest"}</Text>
        <Text style={styles.email}>{user?.email || ""}</Text>
        <Text style={styles.phone}>{user?.phone || ""}</Text>
        {user?.role && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{properties.length}</Text>
          <Text style={styles.statLabel}>Properties</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{bookings.length}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {user?.role === "admin" && (
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Admin Access</Text>
          {adminMenuItem.map((item, index) => {
            const Icon = item.icon;
            const isHighlight = "highlight" in item && item.highlight;
            const isLogout = "isLogout" in item && item.isLogout;
            return (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <Icon
                    size={20}
                    color={
                      isLogout
                        ? "#EF4444"
                        : isHighlight
                        ? "#DC2626"
                        : COLORS.gold
                    }
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      isHighlight && {
                        color: "#DC2626",
                        fontWeight: "600" as const,
                      },
                      isLogout && {
                        color: "#EF4444",
                        fontWeight: "600" as const,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {user?.role === "tech" && (
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Tech Access</Text>
          {techMenuItem.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <Icon size={20} color={COLORS.gold} />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isHighlight = "highlight" in item && item.highlight;
          return (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Icon size={20} color={isHighlight ? COLORS.gold : "#6B7280"} />
                <Text
                  style={[
                    styles.menuItemText,
                    isHighlight && styles.highlightText,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  profileHeader: {
    backgroundColor: COLORS.background.card,
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.background.card,
    marginTop: 8,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.teal,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  menuSection: {
    backgroundColor: COLORS.background.card,
    marginTop: 8,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  highlightText: {
    color: COLORS.gold,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.background.card,
    marginTop: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.accent.error,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  version: {
    fontSize: 12,
    color: COLORS.text.light,
  },
  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: COLORS.teal,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: COLORS.cream,
    letterSpacing: 0.5,
  },
});
