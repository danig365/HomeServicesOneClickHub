import { Tabs } from "expo-router";
import { Home, Calendar, User, FileText, Award } from "lucide-react-native";
import React from "react";
import { COLORS } from "@/constants/colors";
import { SubscriptionProvider } from '@/hooks/subscription-store';
import { PropertiesProvider } from '@/hooks/properties-store';

export default function TabLayout() {
  return (
    <SubscriptionProvider>
      <PropertiesProvider>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: COLORS.gold,
            tabBarInactiveTintColor: COLORS.text.secondary,
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.cream,
              borderTopWidth: 1,
              borderTopColor: '#E8E3D6',
              paddingBottom: 5,
              paddingTop: 5,
              height: 60,
            },
            tabBarLabelStyle: {
              fontWeight: '600',
              fontSize: 11,
              letterSpacing: 0.3,
            },
          }}
        >
          <Tabs.Screen
            name="(home)"
            options={{
              title: "Hudson Home",
              tabBarIcon: ({ color }) => <Home size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="bookings"
            options={{
              title: "Bookings",
              tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
            }}
          />
          
          <Tabs.Screen
            name="myhome"
            options={{
              title: "MyHome",
              tabBarIcon: ({ color }) => <Award size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="vault"
            options={{
              title: "Vault",
              tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color }) => <User size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="cart-tab"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </PropertiesProvider>
    </SubscriptionProvider>
  );
}