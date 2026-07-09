import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { CumulativeChart } from '../components/charts/CumulativeChart';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { StatTile } from '../components/StatTile';
import { showToast } from '../components/Toast';
import { thud } from '../lib/haptics';
import { fmtMoney, fmtNet, netColor } from '../lib/money';
import { fmtDateFull, handsWonIn, playerResults } from '../lib/stats';
import type { RootScreenProps } from '../navigation/types';
import { useStore } from '../store/useStore';
import { colors, radius, sp, type } from '../theme';

export function PlayerSummaryScreen({ navigation, route }: RootScreenProps<'PlayerSummary'>) {
  const players = useStore((s) => s.players);
  const games = useStore((s) => s.games);
  const archivePlayer = useStore((s) => s.archivePlayer);
  const unarchivePlayer = useStore((s) => s.unarchivePlayer);
  const deletePlayer = useStore((s) => s.deletePlayer);
  const restorePlayer = useStore((s) => s.restorePlayer);

  const player = players.find((p) => p.id === route.params.playerId);
  const results = useMemo(
    () => (player ? playerResults(player.id, games) : []),
    [player, games]
  );

  if (!player) {
    // Player was deleted while this screen was open.
    return <SafeAreaView style={styles.screen} />;
  }

  const net = results.length ? results[results.length - 1].cumulative : 0;
  const wins = results.filter((r) => r.won).length;
  const handsWon = handsWonIn(player.id, results.map((r) => r.game));
  const biggestWin = results.length ? Math.max(...results.map((r) => r.net)) : 0;
  const average = results.length ? Math.round(net / results.length) : 0;
  const hasHistory = results.length > 0;

  const onArchive = () => {
    thud();
    archivePlayer(player.id);
    navigation.goBack();
    showToast({
      message: `${player.name} archived — stats and graphs are kept`,
      actionLabel: 'Undo',
      onAction: () => unarchivePlayer(player.id),
    });
  };

  const onDelete = () => {
    const removed = deletePlayer(player.id);
    if (!removed) return;
    thud();
    navigation.goBack();
    showToast({
      message: `${removed.name} deleted`,
      actionLabel: 'Undo',
      onAction: () => restorePlayer(removed),
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Header
        title={player.name}
        subtitle={
          player.archived
            ? 'Archived player'
            : `${results.length} game${results.length === 1 ? '' : 's'} played · ${wins} won`
        }
        onBack={() => navigation.goBack()}
        right={<PlayerAvatar player={player} size={40} />}
      />

      {!hasHistory ? (
        <>
          <EmptyState
            glyph={player.emoji ?? '🃏'}
            title="No games yet"
            message={`${player.name} hasn't played a game.\nTheir story starts with the next Start New Game.`}
          />
          <View style={styles.actions}>
            <Button title="Delete player" variant="danger" size="md" onPress={onDelete} />
          </View>
        </>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: sp(10) }}>
          <View style={styles.tileRow}>
            <StatTile label="Net profit" value={fmtNet(net)} valueColor={netColor(net)} />
            <StatTile label="♠ Hands won" value={`${handsWon}`} valueColor={colors.goldBright} />
          </View>
          <View style={styles.tileRow}>
            <StatTile label="Games won" value={`${wins} / ${results.length}`} />
            <StatTile label="Biggest win" value={fmtNet(biggestWin)} valueColor={netColor(biggestWin)} />
          </View>
          <View style={styles.tileRow}>
            <StatTile label="Avg per game" value={fmtNet(average)} valueColor={netColor(average)} />
          </View>

          <Text style={[type.label, styles.sectionLabel]}>Cumulative net profit</Text>
          <View style={{ paddingHorizontal: sp(5) }}>
            <CumulativeChart player={player} results={results} />
          </View>

          <Text style={[type.label, styles.sectionLabel]}>Game by game</Text>
          <View style={styles.list}>
            {[...results].reverse().map((r) => (
              <View key={r.game.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowDate}>
                    {fmtDateFull(r.date)}
                    {r.won ? '  🏆' : ''}
                  </Text>
                  <Text style={styles.rowMeta}>
                    Won {r.game.hands.filter((h) => h.winnerIds.includes(player.id)).length} of{' '}
                    {r.game.hands.length} hands · buy-in {fmtMoney(r.game.buyIns[player.id] ?? 0)} ·{' '}
                    {r.game.playerIds.length} players
                  </Text>
                </View>
                <Text style={[styles.rowNet, { color: netColor(r.net) }]}>{fmtNet(r.net)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            {player.archived ? (
              <Button
                title="Restore player"
                variant="secondary"
                size="md"
                onPress={() => {
                  unarchivePlayer(player.id);
                  showToast({ message: `${player.name} is back at the table` });
                }}
              />
            ) : (
              <Button title="Archive player" variant="danger" size="md" onPress={onArchive} />
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: sp(2.5), justifyContent: 'center' }}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
              <Text style={type.caption}>
                Players with game history are archived, never deleted — stats and graphs stay.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tileRow: {
    flexDirection: 'row',
    gap: sp(3),
    paddingHorizontal: sp(5),
    marginBottom: sp(3),
  },
  sectionLabel: {
    paddingHorizontal: sp(5),
    marginTop: sp(4),
    marginBottom: sp(2.5),
  },
  list: {
    marginHorizontal: sp(5),
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sp(3),
    paddingHorizontal: sp(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowDate: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  rowNet: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    paddingHorizontal: sp(5),
    marginTop: sp(6),
  },
});
