import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { SegmentedControl } from '../components/SegmentedControl';
import { fmtNet, netColor } from '../lib/money';
import { GameFilter, LeaderboardRow, leaderboardRows } from '../lib/stats';
import type { RootStackParamList } from '../navigation/types';
import { useStore } from '../store/useStore';
import { alpha, cardShadow, colors, radius, sp, type } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MEDALS = [colors.podiumGold, colors.podiumSilver, colors.podiumBronze];

export function LeaderboardScreen() {
  const navigation = useNavigation<Nav>();
  const players = useStore((s) => s.players);
  const games = useStore((s) => s.games);
  const [filter, setFilter] = useState<GameFilter>('all');

  const rows = useMemo(() => leaderboardRows(players, games, filter), [players, games, filter]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  // Classic podium arrangement: 2nd — 1st — 3rd.
  const podiumOrder = [podium[1], podium[0], podium[2]].filter((r): r is LeaderboardRow => !!r);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Header title="Leaderboard" subtitle="Ranked by total net profit" />

      <View style={{ paddingHorizontal: sp(5), marginBottom: sp(4) }}>
        <SegmentedControl
          options={[
            { key: 'all', label: 'All-time' },
            { key: 'last10', label: 'Last 10 games' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </View>

      {rows.length === 0 ? (
        <EmptyState
          glyph="🏆"
          title="No games on the board yet"
          message="Finish your first game and the leaderboard fills itself in — ranks, win rates, the lot."
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: sp(10) }}>
          {/* ——— Podium ——— */}
          <View style={styles.podiumRow}>
            {podiumOrder.map((row) => {
              const rank = rows.indexOf(row) + 1;
              const first = rank === 1;
              return (
                <Pressable
                  key={row.player.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Rank ${rank}: ${row.player.name}, ${fmtNet(row.net)}`}
                  onPress={() => navigation.navigate('PlayerSummary', { playerId: row.player.id })}
                  style={[
                    styles.podiumCard,
                    first && styles.podiumFirst,
                    { borderColor: alpha(MEDALS[rank - 1], 0.55) },
                    first && cardShadow,
                  ]}
                >
                  <View style={[styles.rankBadge, { backgroundColor: MEDALS[rank - 1] }]}>
                    <Text style={styles.rankBadgeText}>{rank}</Text>
                  </View>
                  <PlayerAvatar player={row.player} size={first ? 56 : 44} />
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {row.player.name}
                  </Text>
                  <Text style={[styles.podiumNet, { color: netColor(row.net) }]} numberOfLines={1} adjustsFontSizeToFit>
                    {fmtNet(row.net)}
                  </Text>
                  <Text style={styles.podiumHands}>♠ {row.handsWon} hands</Text>
                  <Text style={styles.podiumMeta}>
                    {row.gamesWon}W · {Math.round(row.winRate * 100)}%
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ——— The field ——— */}
          {rest.length > 0 && (
            <View style={styles.list}>
              {rest.map((row, i) => (
                <Pressable
                  key={row.player.id}
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('PlayerSummary', { playerId: row.player.id })}
                  style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface2 }]}
                >
                  <Text style={styles.rowRank}>{i + 4}</Text>
                  <PlayerAvatar player={row.player} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {row.player.name}
                      {row.player.archived ? '  ·  archived' : ''}
                    </Text>
                    <Text style={styles.rowMeta}>
                      <Text style={styles.rowHands}>♠ {row.handsWon} hands won</Text> · {row.gamesWon} of{' '}
                      {row.gamesPlayed} game{row.gamesPlayed === 1 ? '' : 's'} ·{' '}
                      {Math.round(row.winRate * 100)}% win rate
                    </Text>
                  </View>
                  <Text style={[styles.rowNet, { color: netColor(row.net) }]}>{fmtNet(row.net)}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {filter === 'last10' && (
            <Text style={styles.filterNote}>Counting only the last {Math.min(games.length, 10)} games.</Text>
          )}
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
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: sp(2.5),
    paddingHorizontal: sp(5),
    marginBottom: sp(4),
  },
  podiumCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingVertical: sp(4),
    paddingHorizontal: sp(2),
  },
  podiumFirst: {
    paddingVertical: sp(6),
    backgroundColor: colors.surface2,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp(2),
  },
  rankBadgeText: {
    color: '#141419',
    fontSize: 13,
    fontWeight: '800',
  },
  podiumName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: sp(2),
    maxWidth: '95%',
  },
  podiumNet: {
    fontSize: 17,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  podiumHands: {
    color: colors.goldBright,
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 3,
  },
  podiumMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
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
    gap: sp(3),
    paddingVertical: sp(3),
    paddingHorizontal: sp(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowRank: {
    width: 22,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  rowName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  rowHands: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  rowNet: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  filterNote: {
    ...type.caption,
    textAlign: 'center',
    marginTop: sp(4),
  },
});
