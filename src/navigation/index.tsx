import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { colors } from '../theme';

import { EndGameScreen } from '../screens/EndGameScreen';
import { GameResultScreen } from '../screens/GameResultScreen';
import { InGameScreen } from '../screens/InGameScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { PerformanceScreen } from '../screens/PerformanceScreen';
import { PlayersScreen } from '../screens/PlayersScreen';
import { PlayerSummaryScreen } from '../screens/PlayerSummaryScreen';
import { StartGameScreen } from '../screens/StartGameScreen';

import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

/** The app never renders a light theme — this is the only navigation theme. */
const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.gold,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    notification: colors.gold,
  },
};

const TAB_ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Players: 'people',
  Leaderboard: 'trophy',
  Performance: 'analytics',
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 84,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.goldBright,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name] : (`${TAB_ICONS[route.name]}-outline` as keyof typeof Ionicons.glyphMap)}
            size={23}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Players" component={PlayersScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Performance" component={PerformanceScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const hasActiveGame = useMemo(() => useStore.getState().activeGame !== null, []);

  return (
    <NavigationContainer
      theme={navTheme}
      // Killed mid-game? Reopen straight onto the in-progress game.
      initialState={
        hasActiveGame
          ? { routes: [{ name: 'Tabs' as const }, { name: 'InGame' as const }] }
          : undefined
      }
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="StartGame" component={StartGameScreen} />
        <Stack.Screen name="InGame" component={InGameScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="EndGame" component={EndGameScreen} />
        <Stack.Screen
          name="GameResult"
          component={GameResultScreen}
          options={{ animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen name="PlayerSummary" component={PlayerSummaryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
