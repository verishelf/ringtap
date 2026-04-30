import { Stack } from 'expo-router';

const lightBg = '#FAFAFA';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: lightBg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="questionnaire" />
      <Stack.Screen name="upsell" />
    </Stack>
  );
}
