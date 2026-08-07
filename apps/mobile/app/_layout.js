import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Baloo2_600SemiBold, Baloo2_700Bold } from '@expo-google-fonts/baloo-2';
import { Mulish_400Regular, Mulish_600SemiBold, Mulish_700Bold } from '@expo-google-fonts/mulish';
import {
  BalooBhaijaan2_600SemiBold,
  BalooBhaijaan2_700Bold,
} from '@expo-google-fonts/baloo-bhaijaan-2';
import { setPersistentStorage } from '../src/api/storage.js';
import { initLocale } from '../src/i18n/index.js';
import { useAuthStore } from '../src/store/authStore.js';
import { colors } from '../src/theme.js';

// On-device, the mock client persists through AsyncStorage (in tests/node it
// falls back to the in-memory storage registered in src/api/storage.js).
setPersistentStorage(AsyncStorage);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Mulish_400Regular,
    Mulish_600SemiBold,
    Mulish_700Bold,
    BalooBhaijaan2_600SemiBold,
    BalooBhaijaan2_700Bold,
  });
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initLocale();
    useAuthStore.getState().hydrate();
  }, []);

  // Auth guard: once the session state is known, anonymous users only see /auth/*.
  useEffect(() => {
    if (!hydrated) return;
    if (!user && segments[0] !== 'auth') {
      router.replace('/auth/sign-in');
    }
  }, [hydrated, user, segments, router]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="camera" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
