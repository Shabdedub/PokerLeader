import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Confetti } from '../components/Confetti';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { fmtNet, netColor } from '../lib/money';
import type { RootScreenProps } from '../navigation/types';
import { useStore } from '../store/useStore';
import { alpha, cardShadow, colors, radius, sp, type } from '../theme';

export function GameResultScreen({ navigation, route }: RootScreenProps<'GameResult'>) {
  const insets = useSafeAreaInsets();
  const players = useStore((s) => s.players);
  const games = useStore((s) => s.games);
  const game = games.find((g) => g.id === route.params.gameId);

  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [pop]);

  const rows = useMemo(() => {
    if (!game) return [];
    return game.playerIds
      .map((id) => ({
        player: players.find((p) => p.id === id),
        net: game.results?.[id] ?? 0,
        won: game.winnerIds?.includes(id) ?? false,
      }))
      .filter((r) => !!r.player)
      .sort((a, b) => b.net - a.net);
  }, [game, players]);

  if (!game) return <SafeAreaView style={styles.screen} />;

  const winners = rows.filter((r) => r.won);
  const winnerNames = winners.map((r) => r.player!.name).join(' & ');
  const winnerNet = winners[0]?.net ?? 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: sp(10), flexGrow: 1 }}>
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: pop,
              transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
            },
          ]}
        >
          <View style={[styles.trophyRing, cardShadow]}>
            <Text style={{ fontSize: 54 }}>🏆</Text>
          </View>
          <Text style={styles.winnerLabel}>{winners.length > 1 ? 'Winners' : 'Winner'}</Text>
          <Text style={styles.winnerName} numberOfLines={2}>
            {winnerNames}
          </Text>
          <Text style={[styles.winnerNet, { color: netColor(winnerNet) }]}>{fmtNet(winnerNet)}</Text>
        </Animated.View>

        <View style={styles.results}>
          {rows.map((r, i) => (
            <View key={r.player!.id} style={[styles.resultRow, r.won && styles.resultRowWinner]}>
              <Text style={styles.rank}>{i + 1}</Text>
              <PlayerAvatar player={r.player!} size={36} />
              <Text style={styles.resultName} numberOfLines={1}>
                {r.player!.name}
                {r.won ? ' 🏆' : ''}
              </Text>
              <Text style={[styles.resultNet, { color: netColor(r.net) }]}>{fmtNet(r.net)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: sp(5), paddingBottom: insets.bottom + sp(3), gap: sp(2.5) }}>
        <Button title="Done" onPress={() => navigation.popToTop()} />
        <Button
          title="View leaderboard"
          variant="ghost"
          size="md"
          onPress={() => navigation.navigate('Tabs', { screen: 'Leaderboard' })}
        />
      </View>

      <Confetti />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hero: {
    alignItems: 'center',
    paddingTop: sp(10),
    paddingHorizontal: sp(6),
  },
  trophyRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: colors.goldDim,
    borderWidth: 2,
    borderColor: alpha(colors.gold, 0.55),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp(4),
  },
  winnerLabel: {
    ...type.label,
    color: colors.gold,
  },
  winnerName: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'center',
    marginTop: sp(1),
  },
  winnerNet: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: sp(1),
  },
  results: {
    marginTop: sp(8),
    marginHorizontal: sp(5),
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(3),
    paddingVertical: sp(3),
    paddingHorizontal: sp(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  resultRowWinner: {
    backgroundColor: colors.goldDim,
  },
  rank: {
    width: 20,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  resultName: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  resultNet: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
