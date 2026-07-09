import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastHost } from './src/components/Toast';
import { AppNavigator } from './src/navigation';
import { useStore } from './src/store/useStore';
import { colors } from './src/theme';

/**
 * Poker Night — dark mode only, everywhere. The OS theme setting is ignored;
 * status bar and Android navigation bar are styled to match the near-black UI.
 */
export default function App() {
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
    if (Platform.OS === 'android') {
      // Edge-to-edge nav bar: light buttons over the near-black plane.
      NavigationBar.NavigationBar.setStyle('light');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {hydrated ? (
        <>
          <AppNavigator />
          <ToastHost />
        </>
      ) : (
        // Saved games are still loading from device storage — hold the dark plane.
        <View style={{ flex: 1, backgroundColor: colors.bg }} />
      )}
    </SafeAreaProvider>
  );
}
