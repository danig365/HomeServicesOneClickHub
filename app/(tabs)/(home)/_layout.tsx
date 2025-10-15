import { Stack } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { ShoppingCart } from "lucide-react-native";
import { router } from "expo-router";
import { useCart } from "@/hooks/cart-store";
import CartBadge from "@/components/CartBadge";
import { COLORS } from "@/constants/colors";

export default function HomeLayout() {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <Stack
      screenOptions={{
        headerStyle: { 
          backgroundColor: COLORS.teal,
        },
        headerTintColor: COLORS.cream,
        headerTitleStyle: { 
          fontSize: 18,
          fontWeight: '700',
          letterSpacing : -0.3,
        },
        headerTitleAlign: 'left',
        headerLeftContainerStyle: {
          paddingLeft: 16,
        },
        headerRightContainerStyle: {
          paddingRight: 16,
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Home Services",
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push('/cart')}
              style={{ padding: 4 }}
            >
              <View>
                <ShoppingCart size={24} color={COLORS.cream} strokeWidth={2.5} />
                <CartBadge count={itemCount} />
              </View>
            </TouchableOpacity>
          ),
        }} 
      />
      <Stack.Screen 
        name="appointments-list"
        options={{ 
          title: "Appointments",
          headerStyle: { backgroundColor: COLORS.teal },
          headerTintColor: 'white',
        }}
      />
    </Stack>
  );
}