import { useEffect } from 'react';
import { Stack } from 'expo-router';
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

  useEffect(() => {
    initLocale();
  }, []);

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
