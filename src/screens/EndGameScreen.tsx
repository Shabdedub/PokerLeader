import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { ChipTally } from '../components/ChipTally';
import { Header } from '../components/Header';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { breakdown, chipTotal } from '../lib/chips';
import { success } from '../lib/haptics';
import { fmtMoney, fmtNet, netColor } from '../lib/money';
import type { RootScreenProps } from '../navigation/types';
import { useStore } from '../store/useStore';
import { alpha, colors, radius, sp, type } from '../theme';
import { ChipCounts, Player } from '../types';

export function EndGameScreen({ navigation }: RootScreenProps<'EndGame'>) {
  const insets = useSafeAreaInsets();
  const players = useStore((s) => s.players);
  const endGame = useStore((s) => s.endGame);

  // Freeze the game at mount: ending it clears activeGame while we navigate away.
  const [game] = useState(() => useStore.getState().activeGame);

  // Pre-filled from the tracked stacks, so the common case is just confirming.
  const [finalChips, setFinalChips] = useState<Record<string, ChipCounts>>(() => {
    const out: Record<string, ChipCounts> = {};
    if (game) for (const id of game.playerIds) out[id] = breakdown(game.stacks[id] ?? 0);
    return out;
  });

  const seated: Player[] = useMemo(
    () =>
      (game?.playerIds ?? [])
        .map((id) => players.find((p) => p.id === id))
        .filter((p): p is Player => !!p),
    [game?.playerIds, players]
  );

  if (!game) return <SafeAreaView style={styles.screen} />;

  const totals: Record<string, number> = {};
  for (const id of game.playerIds) totals[id] = chipTotal(finalChips[id] ?? breakdown(0));

  const tableTotal = game.playerIds.reduce((sum, id) => sum + totals[id], 0);
  const buyInTotal = game.playerIds.reduce((sum, id) => sum + (game.buyIns[id] ?? 0), 0);
  const mismatch = tableTotal - buyInTotal;

  const onEndGame = () => {
    const finished = endGame(totals);
    if (!finished) return;
    success();
    navigation.reset({
      index: 1,
      routes: [{ name: 'Tabs' }, { name: 'GameResult', params: { gameId: finished.id } }],
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Header
        title="End Game"
        subtitle="Confirm everyone's final chips"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: sp(44) }} keyboardShouldPersistTaps="handled">
        {seated.map((p) => {
          const total = totals[p.id];
          const net = total - (game.buyIns[p.id] ?? 0);
          return (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <PlayerAvatar player={p} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={type.caption}>Buy-in {fmtMoney(game.buyIns[p.id] ?? 0)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.total]}>{fmtMoney(total)}</Text>
                  <View style={[styles.netBadge, { backgroundColor: alpha(netColor(net), 0.14) }]}>
                    <Text style={[styles.netText, { color: netColor(net) }]}>{fmtNet(net)}</Text>
                  </View>
                </View>
              </View>
              <ChipTally
                compact
                hideTotal
                counts={finalChips[p.id] ?? breakdown(0)}
                onChange={(next) => setFinalChips((cur) => ({ ...cur, [p.id]: next }))}
              />
            </View>
          );
        })}

        {mismatch !== 0 && (
          <Text style={styles.mismatch}>
            Chips on the table come to {fmtMoney(tableTotal)}, but buy-ins were {fmtMoney(buyInTotal)} — off by{' '}
            {fmtMoney(Math.abs(mismatch))}. Adjust a count if that's wrong, or end the game anyway.
          </Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + sp(3) }]}>
        <View style={styles.footerSummary}>
          <Text style={type.caption}>Final table</Text>
          <Text style={[type.money, { color: colors.gold, fontSize: 17 }]}>{fmtMoney(tableTotal)}</Text>
        </View>
        <Button title="End game" onPress={onEndGame} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    marginHorizontal: sp(5),
    marginBottom: sp(3),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: sp(4),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(3),
    marginBottom: sp(3.5),
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  total: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  netBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 3,
  },
  netText: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  mismatch: {
    marginHorizontal: sp(5),
    marginTop: sp(1),
    color: colors.warning,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: sp(5),
    paddingTop: sp(3),
    backgroundColor: alpha(colors.bg, 0.95),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp(3),
  },
});
