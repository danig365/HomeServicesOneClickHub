import { Stack } from 'expo-router';
import { COLORS } from '@/constants/colors';

export default function MyHomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.teal },
        headerTintColor: COLORS.cream,
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'MyHome',
        }}
      />
    </Stack>
  );
}
