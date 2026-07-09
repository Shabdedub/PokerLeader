import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddPlayerSheet } from '../components/AddPlayerSheet';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { showToast } from '../components/Toast';
import { fmtMoney, fmtNet, netColor } from '../lib/money';
import { lifetimeStats } from '../lib/stats';
import type { RootStackParamList } from '../navigation/types';
import { useStore } from '../store/useStore';
import { alpha, cardShadow, colors, radius, sp, type } from '../theme';
import { Player } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PlayersScreen() {
  const navigation = useNavigation<Nav>();
  const players = useStore((s) => s.players);
  const games = useStore((s) => s.games);
  const activeGame = useStore((s) => s.activeGame);
  const unarchivePlayer = useStore((s) => s.unarchivePlayer);
  const [showAdd, setShowAdd] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const active = useMemo(() => players.filter((p) => !p.archived), [players]);
  const archived = useMemo(() => players.filter((p) => p.archived), [players]);

  const startNewGame = () => {
    if (active.length < 2) {
      showToast({
        message: `You need at least 2 players to start a game — you have ${active.length === 0 ? 'none' : 'only 1'}.`,
        actionLabel: 'Add player',
        onAction: () => setShowAdd(true),
      });
      return;
    }
    navigation.navigate('StartGame');
  };

  const tableTotal = activeGame
    ? Object.values(activeGame.stacks).reduce((a, b) => a + b, 0)
    : 0;

  const gridData: (Player | 'add')[] = [...active, 'add'];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.brandMark}>♠</Text>
        <View style={{ flex: 1 }}>
          <Text style={type.title}>Poker Night</Text>
          <Text style={type.caption}>
            {active.length === 0
              ? 'No players yet'
              : `${active.length} player${active.length === 1 ? '' : 's'} · ${games.length} game${games.length === 1 ? '' : 's'} played`}
          </Text>
        </View>
      </View>

      {activeGame && (
        <Pressable onPress={() => navigation.navigate('InGame')} style={[styles.resumeCard, cardShadow]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.resumeTitle}>Game in progress</Text>
            <Text style={styles.resumeMeta}>
              Hand {activeGame.hands.length + 1} · {fmtMoney(tableTotal)} on the table
            </Text>
          </View>
          <View style={styles.resumeButton}>
            <Text style={{ color: colors.onGold, fontWeight: '800', fontSize: 14 }}>Resume game</Text>
          </View>
        </Pressable>
      )}

      {active.length === 0 && archived.length === 0 ? (
        <EmptyState
          glyph="♠"
          title="Welcome to Poker Night"
          message={'Add your crew, then start a game.\nEvery hand, stack and win gets tracked for you.'}
          actionLabel="Add player"
          onAction={() => setShowAdd(true)}
        />
      ) : (
        <FlatList
          data={gridData}
          keyExtractor={(item) => (item === 'add' ? 'add' : item.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: sp(3), paddingHorizontal: sp(5) }}
          contentContainerStyle={{ paddingBottom: sp(30), gap: sp(3) }}
          renderItem={({ item }) =>
            item === 'add' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add player"
                onPress={() => setShowAdd(true)}
                style={({ pressed }) => [styles.addTile, pressed && { backgroundColor: colors.surface }]}
              >
                <Ionicons name="add" size={30} color={colors.gold} />
                <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 14, marginTop: 4 }}>Add player</Text>
              </Pressable>
            ) : (
              <PlayerCard player={item} onPress={() => navigation.navigate('PlayerSummary', { playerId: item.id })} />
            )
          }
          ListFooterComponent={
            archived.length > 0 ? (
              <View style={{ paddingHorizontal: sp(5), marginTop: sp(4) }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowArchived((v) => !v)}
                  style={styles.archivedToggle}
                >
                  <Text style={[type.label, { color: colors.textMuted }]}>
                    Archived ({archived.length})
                  </Text>
                  <Ionicons name={showArchived ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
                </Pressable>
                {showArchived &&
                  archived.map((p) => (
                    <View key={p.id} style={styles.archivedRow}>
                      <PlayerAvatar player={p} size={36} />
                      <Text style={styles.archivedName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Button
                        title="Restore"
                        variant="secondary"
                        size="sm"
                        onPress={() => {
                          unarchivePlayer(p.id);
                          showToast({ message: `${p.name} is back at the table` });
                        }}
                      />
                    </View>
                  ))}
              </View>
            ) : null
          }
        />
      )}

      {active.length > 0 && (
        <View style={styles.footer}>
          <Button title="Start New Game" onPress={startNewGame} />
        </View>
      )}

      <AddPlayerSheet visible={showAdd} onClose={() => setShowAdd(false)} />
    </SafeAreaView>
  );
}

function PlayerCard({ player, onPress }: { player: Player; onPress: () => void }) {
  const games = useStore((s) => s.games);
  const stats = useMemo(() => lifetimeStats(player.id, games), [player.id, games]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${player.name}, lifetime ${fmtNet(stats.net)}, ${stats.handsWon} hands won, ${stats.gamesWon} games won`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: alpha(player.color, pressed ? 0.16 : 0.1),
          borderColor: alpha(player.color, 0.38),
        },
      ]}
    >
      <PlayerAvatar player={player} size={46} />
      <Text style={styles.cardName} numberOfLines={1}>
        {player.name}
      </Text>
      <Text style={[styles.cardNet, { color: netColor(stats.net) }]}>{fmtNet(stats.net)}</Text>
      <View style={styles.cardHands}>
        <Text style={styles.cardHandsGlyph}>♠</Text>
        <Text style={styles.cardHandsText}>
          {stats.handsWon} hand{stats.handsWon === 1 ? '' : 's'} won
        </Text>
      </View>
      <View style={styles.cardWins}>
        <Ionicons name="trophy" size={11} color={colors.textMuted} />
        <Text style={styles.cardWinsText}>
          {stats.gamesWon} game{stats.gamesWon === 1 ? '' : 's'} won
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(5),
    paddingTop: sp(2),
    paddingBottom: sp(4),
    gap: sp(3),
  },
  brandMark: {
    fontSize: 26,
    color: colors.gold,
  },
  resumeCard: {
    marginHorizontal: sp(5),
    marginBottom: sp(4),
    backgroundColor: colors.goldDim,
    borderWidth: 1,
    borderColor: alpha(colors.gold, 0.45),
    borderRadius: radius.lg,
    padding: sp(4),
    flexDirection: 'row',
    alignItems: 'center',
  },
  resumeTitle: {
    color: colors.goldBright,
    fontWeight: '800',
    fontSize: 15,
  },
  resumeMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  resumeButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: sp(4),
    minHeight: 140,
  },
  cardName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: sp(2.5),
  },
  cardNet: {
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  cardHands: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: sp(2),
  },
  cardHandsGlyph: {
    color: colors.gold,
    fontSize: 13,
  },
  cardHandsText: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  cardWins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: sp(1),
  },
  cardWinsText: {
    color: colors.textMuted,
    fontSize: 11.5,
    fontWeight: '600',
  },
  addTile: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: sp(2),
  },
  archivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(3),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: sp(3),
    marginTop: sp(2),
  },
  archivedName: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: sp(5),
    paddingTop: sp(3),
    paddingBottom: sp(3),
    backgroundColor: alpha(colors.bg, 0.92),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
