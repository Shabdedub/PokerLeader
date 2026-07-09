import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { ChipTally } from '../components/ChipTally';
import { Header } from '../components/Header';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { chipTotal, emptyChips } from '../lib/chips';
import { success, tap } from '../lib/haptics';
import { fmtMoney } from '../lib/money';
import type { RootScreenProps } from '../navigation/types';
import { useStore } from '../store/useStore';
import { alpha, colors, radius, sp, type } from '../theme';
import { ChipCounts } from '../types';

export function StartGameScreen({ navigation }: RootScreenProps<'StartGame'>) {
  const players = useStore((s) => s.players);
  const startGame = useStore((s) => s.startGame);
  const active = useMemo(() => players.filter((p) => !p.archived), [players]);

  const [selected, setSelected] = useState<string[]>([]);
  const [sameBuyIn, setSameBuyIn] = useState(true);
  const [sharedChips, setSharedChips] = useState<ChipCounts>(emptyChips());
  const [perPlayerChips, setPerPlayerChips] = useState<Record<string, ChipCounts>>({});

  const toggle = (id: string) => {
    tap();
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const chipsFor = (id: string): ChipCounts => (sameBuyIn ? sharedChips : perPlayerChips[id] ?? emptyChips());

  const totalOnTable = selected.reduce((sum, id) => sum + chipTotal(chipsFor(id)), 0);
  const canStart = selected.length >= 2;

  const start = () => {
    const buyIns: Record<string, number> = {};
    for (const id of selected) buyIns[id] = chipTotal(chipsFor(id));
    startGame(selected, buyIns);
    success();
    navigation.replace('InGame');
  };

  // Seat order = selection order.
  const selectedPlayers = selected
    .map((id) => active.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Header title="Start New Game" subtitle="Pick tonight's table" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: sp(36) }} keyboardShouldPersistTaps="handled">
        <Text style={[type.label, styles.sectionLabel]}>Players</Text>
        <View style={styles.playerWrap}>
          {active.map((p) => {
            const isSelected = selected.includes(p.id);
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${p.name}${isSelected ? ', selected' : ''}`}
                onPress={() => toggle(p.id)}
                style={[
                  styles.playerChip,
                  {
                    backgroundColor: alpha(p.color, isSelected ? 0.18 : 0.07),
                    borderColor: isSelected ? colors.gold : alpha(p.color, 0.3),
                  },
                ]}
              >
                <PlayerAvatar player={p} size={34} />
                <Text style={[styles.playerChipName, isSelected && { color: colors.text }]} numberOfLines={1}>
                  {p.name}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={18} color={colors.gold} />}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.buyInHeader}>
          <Text style={[type.label, { flex: 1 }]}>Buy-in</Text>
          <Text style={styles.sameLabel}>Same buy-in for everyone</Text>
          <Switch
            value={sameBuyIn}
            onValueChange={(v) => {
              tap();
              setSameBuyIn(v);
            }}
            trackColor={{ false: colors.surface3, true: alpha(colors.gold, 0.5) }}
            thumbColor={sameBuyIn ? colors.gold : colors.textMuted}
          />
        </View>

        {selected.length < 2 ? (
          <Text style={styles.hint}>Select at least 2 players to set buy-ins.</Text>
        ) : sameBuyIn ? (
          <View style={styles.tallyCard}>
            <Text style={styles.tallyTitle}>Everyone starts with</Text>
            <ChipTally counts={sharedChips} onChange={setSharedChips} />
          </View>
        ) : (
          selectedPlayers.map((p) => (
            <View key={p.id} style={styles.tallyCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: sp(2.5), marginBottom: sp(3) }}>
                <PlayerAvatar player={p} size={32} />
                <Text style={styles.tallyTitle}>{p.name} starts with</Text>
              </View>
              <ChipTally
                compact
                counts={perPlayerChips[p.id] ?? emptyChips()}
                onChange={(next) => setPerPlayerChips((cur) => ({ ...cur, [p.id]: next }))}
              />
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <Text style={type.caption}>
            {selected.length} player{selected.length === 1 ? '' : 's'} selected
          </Text>
          <Text style={[type.money, { color: colors.gold, fontSize: 17 }]}>{fmtMoney(totalOnTable)} on the table</Text>
        </View>
        <Button title="Start game" onPress={start} disabled={!canStart} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  sectionLabel: {
    paddingHorizontal: sp(5),
    marginBottom: sp(2.5),
  },
  playerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(2.5),
    paddingHorizontal: sp(5),
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(2),
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingVertical: 7,
    paddingLeft: 8,
    paddingRight: 14,
    maxWidth: '48%',
  },
  playerChipName: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 15,
    flexShrink: 1,
  },
  buyInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(2.5),
    paddingHorizontal: sp(5),
    marginTop: sp(7),
    marginBottom: sp(2.5),
  },
  sameLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 14,
    paddingHorizontal: sp(5),
    paddingVertical: sp(4),
  },
  tallyCard: {
    marginHorizontal: sp(5),
    marginBottom: sp(3),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: sp(4),
  },
  tallyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: sp(3),
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: sp(5),
    paddingTop: sp(3),
    paddingBottom: sp(8),
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
