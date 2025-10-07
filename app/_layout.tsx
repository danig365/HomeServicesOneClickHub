import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CartProvider } from "@/hooks/cart-store";
import { BookingsProvider } from "@/hooks/bookings-store";
import { VaultProvider } from "@/hooks/vault-store";
import { PropertiesProvider } from "@/hooks/properties-store";
import { SubscriptionProvider } from "@/hooks/subscription-store";
import { UserProvider } from "@/hooks/user-store";
import { TechAppointmentsProvider } from "@/hooks/tech-appointments-store";
import { SnapshotProvider } from "@/hooks/snapshot-store";
import { AuthProvider, useAuth } from "@/hooks/auth-store";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { trpc, trpcReactClient } from "@/lib/trpc";

const TEAL = '#14B8A6';
const CREAM = '#FFF8E7';

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inPublicRoute = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'forgot-password';
    const inTechPortal = segments[0] === 'tech-portal';

    if (!isAuthenticated && !inPublicRoute) {
      router.replace('/login');
    } else if (isAuthenticated && inPublicRoute && !inTechPortal) {
      router.replace('/(tabs)/(home)');
    }
  }, [isAuthenticated, segments, isLoading, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={TEAL} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Back",
      headerStyle: { 
        backgroundColor: TEAL,
      },
      headerTintColor: CREAM,
      headerTitleStyle: { 
        fontWeight: '700',
        fontSize: 18,
      },
    }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="service/[id]" 
        options={{ 
          title: "Service Details",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="cart" 
        options={{ 
          title: "Your Cart",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="checkout" 
        options={{ 
          title: "Checkout",
        }} 
      />
      <Stack.Screen 
        name="document/[id]" 
        options={{ 
          title: "Document",
        }} 
      />
      <Stack.Screen 
        name="document/add" 
        options={{ 
          title: "Add Document",
        }} 
      />
      <Stack.Screen 
        name="properties" 
        options={{ 
          title: "My Properties",
        }} 
      />
      <Stack.Screen 
        name="blueprint" 
        options={{ 
          title: "MyHome Blueprint",
        }} 
      />
      <Stack.Screen 
        name="tech-portal" 
        options={{ 
          title: "Tech Portal",
        }} 
      />
      <Stack.Screen 
        name="referral-card" 
        options={{ 
          title: "Referral Card",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="snapshot-inspection/[id]" 
        options={{ 
          title: "Snapshot Inspection",
        }} 
      />
      <Stack.Screen 
        name="property-reminders" 
        options={{ 
          title: "Property Reminders",
        }} 
      />
      <Stack.Screen 
        name="appointment/[id]" 
        options={{ 
          title: "Appointment Details",
        }} 
      />
      <Stack.Screen 
        name="admin-dashboard" 
        options={{ 
          title: "Admin Dashboard",
        }} 
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CREAM,
  },
});

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcReactClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <UserProvider>
              <PropertiesProvider>
                <SubscriptionProvider>
                  <TechAppointmentsProvider>
                    <SnapshotProvider>
                      <CartProvider>
                        <BookingsProvider>
                          <VaultProvider>
                            <RootLayoutNav />
                          </VaultProvider>
                        </BookingsProvider>
                      </CartProvider>
                    </SnapshotProvider>
                  </TechAppointmentsProvider>
                </SubscriptionProvider>
              </PropertiesProvider>
            </UserProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}