import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  StartGame: undefined;
  InGame: undefined;
  EndGame: undefined;
  GameResult: { gameId: string };
  PlayerSummary: { playerId: string };
};

export type TabParamList = {
  Players: undefined;
  Leaderboard: undefined;
  Performance: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
