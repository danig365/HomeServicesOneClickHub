import { Stack } from "expo-router";
import React from "react";

const TEAL = '#0D9488';
const CREAM = '#FAF8F3';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { 
          backgroundColor: TEAL,
        },
        headerTintColor: CREAM,
        headerTitleStyle: { 
          fontFamily: 'Begum',
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Profile",
        }} 
      />
    </Stack>
  );
}