import { Stack } from 'expo-router';
import React from 'react';
import { COLORS } from '@/constants/colors';

export default function VaultLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { 
          backgroundColor: COLORS.teal,
        },
        headerTintColor: COLORS.cream,
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
          title: 'MyHome Vault',
        }}
      />
    </Stack>
  );
}