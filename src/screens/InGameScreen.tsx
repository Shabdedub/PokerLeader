import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { ChipTally } from '../components/ChipTally';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { showToast } from '../components/Toast';
import { chipTotal, emptyChips } from '../lib/chips';
import { success, tap, thud, warn } from '../lib/haptics';
import { fmtMoney } from '../lib/money';
import type { RootScreenProps } from '../navigation/types';
import { useStore } from '../store/useStore';
import { alpha, cardShadow, colors, radius, sp, type } from '../theme';
import { ChipCounts, Player } from '../types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function InGameScreen({ navigation }: RootScreenProps<'InGame'>) {
  const insets = useSafeAreaInsets();
  const players = useStore((s) => s.players);
  const activeGame = useStore((s) => s.activeGame);
  const saveHand = useStore((s) => s.saveHand);
  const skipHand = useStore((s) => s.skipHand);
  const undoLastHand = useStore((s) => s.undoLastHand);
  const updateChips = useStore((s) => s.updateChips);
  const discardGame = useStore((s) => s.discardGame);
  const restoreGame = useStore((s) => s.restoreGame);

  const [winners, setWinners] = useState<string[]>([]);
  const [pot, setPot] = useState<ChipCounts>(emptyChips());
  const [reconcileId, setReconcileId] = useState<string | null>(null);
  const [reconcileChips, setReconcileChips] = useState<ChipCounts>(emptyChips());
  const [menuOpen, setMenuOpen] = useState(false);

  const seated: Player[] = useMemo(
    () =>
      (activeGame?.playerIds ?? [])
        .map((id) => players.find((p) => p.id === id))
        .filter((p): p is Player => !!p),
    [activeGame?.playerIds, players]
  );

  if (!activeGame) {
    // Game just ended or was discarded — nothing to show here.
    return <SafeAreaView style={styles.screen} />;
  }

  const handNumber = activeGame.hands.length + 1;
  const tableTotal = Object.values(activeGame.stacks).reduce((a, b) => a + b, 0);
  const lastHand = activeGame.hands[activeGame.hands.length - 1];
  const potTotal = chipTotal(pot);

  const toggleWinner = (id: string) => {
    tap();
    setWinners((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const onSave = () => {
    if (winners.length === 0) return;
    const names = winners
      .map((id) => seated.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(' & ');
    animate();
    saveHand(winners, pot);
    success();
    showToast({
      message:
        winners.length > 1
          ? `Hand ${handNumber} — ${names} split ${fmtMoney(potTotal)}`
          : `Hand ${handNumber} — ${names} wins ${fmtMoney(potTotal)}`,
      duration: 2600,
    });
    setWinners([]);
    setPot(emptyChips());
  };

  const onSkip = () => {
    animate();
    skipHand();
    thud();
    showToast({ message: `Hand ${handNumber} skipped`, duration: 2000 });
  };

  const onUndo = () => {
    const undone = undoLastHand();
    if (!undone) return;
    animate();
    thud();
    showToast({
      message: undone.skipped
        ? `Skipped hand ${activeGame.hands.length} removed`
        : `Hand ${activeGame.hands.length} undone — ${fmtMoney(undone.potTotal)} returned`,
      duration: 2600,
    });
  };

  const openReconcile = (id: string) => {
    thud();
    setReconcileChips(emptyChips());
    setReconcileId(id);
  };

  const onUpdateChips = () => {
    if (!reconcileId) return;
    const player = seated.find((p) => p.id === reconcileId);
    const before = activeGame.stacks[reconcileId] ?? 0;
    const after = chipTotal(reconcileChips);
    animate();
    updateChips(reconcileId, reconcileChips);
    success();
    setReconcileId(null);
    showToast({
      message: `${player?.name ?? 'Player'}: ${fmtMoney(before)} → ${fmtMoney(after)}`,
      actionLabel: 'Undo',
      onAction: () => {
        const g = useStore.getState().activeGame;
        if (g && g.playerIds.includes(reconcileId)) {
          useStore.setState({ activeGame: { ...g, stacks: { ...g.stacks, [reconcileId]: before } } });
        }
      },
    });
  };

  const onDiscard = () => {
    setMenuOpen(false);
    const snapshot = discardGame();
    if (!snapshot) return;
    warn();
    navigation.popToTop();
    showToast({
      message: 'Game discarded — nothing was saved',
      actionLabel: 'Undo',
      onAction: () => restoreGame(snapshot),
      duration: 6000,
    });
  };

  const reconcilePlayer = reconcileId ? seated.find((p) => p.id === reconcileId) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* ——— Header ——— */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Minimise game"
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.headerIcon}
        >
          <Ionicons name="chevron-down" size={26} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.handTitle}>Hand {handNumber}</Text>
          <Text style={styles.tableTotal}>{fmtMoney(tableTotal)} on the table</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Game options"
          onPress={() => setMenuOpen(true)}
          hitSlop={10}
          style={styles.headerIcon}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: sp(4) }} keyboardShouldPersistTaps="handled">
        {/* ——— Winner selection ——— */}
        <Text style={[type.label, styles.sectionLabel]}>
          {winners.length === 0 ? 'Tap the winner' : winners.length === 1 ? 'Winner' : `Split pot · ${winners.length} winners`}
        </Text>
        <View style={styles.grid}>
          {seated.map((p) => {
            const stack = activeGame.stacks[p.id] ?? 0;
            const isWinner = winners.includes(p.id);
            const bust = stack === 0;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={`${p.name}, stack ${fmtMoney(stack)}${isWinner ? ', selected as winner' : ''}`}
                accessibilityHint="Long press to update their chips"
                onPress={() => toggleWinner(p.id)}
                onLongPress={() => openReconcile(p.id)}
                delayLongPress={380}
                style={[
                  styles.playerCard,
                  {
                    backgroundColor: alpha(p.color, isWinner ? 0.16 : 0.09),
                    borderColor: isWinner ? colors.gold : alpha(p.color, 0.32),
                    borderWidth: isWinner ? 2 : 1,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: sp(2) }}>
                  <PlayerAvatar player={p} size={32} />
                  <Text style={styles.playerName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  {isWinner && <Ionicons name="checkmark-circle" size={20} color={colors.gold} />}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: sp(2), marginTop: sp(2) }}>
                  <Text style={[styles.stack, bust && { color: colors.loss }]}>{fmtMoney(stack)}</Text>
                  {bust && <Text style={styles.bustTag}>BUST</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ——— Pot ——— */}
        <Text style={[type.label, styles.sectionLabel, { marginTop: sp(5) }]}>Pot</Text>
        <View style={styles.potCard}>
          <ChipTally counts={pot} onChange={setPot} />
        </View>

        {lastHand && (
          <Text style={styles.lastHand}>
            Last hand:{' '}
            {lastHand.skipped
              ? 'skipped'
              : `${lastHand.winnerIds
                  .map((id) => seated.find((p) => p.id === id)?.name ?? '?')
                  .join(' & ')} won ${fmtMoney(lastHand.potTotal)}`}
          </Text>
        )}
      </ScrollView>

      {/* ——— Actions: Save / Skip / Undo — always one tap away ——— */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + sp(3) }, cardShadow]}>
        <View style={{ flexDirection: 'row', gap: sp(3) }}>
          <Button title="Skip hand" variant="secondary" onPress={onSkip} style={{ flex: 1 }} />
          <Button title="Save hand" onPress={onSave} disabled={winners.length === 0} style={{ flex: 1.6 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: sp(3), marginTop: sp(2.5) }}>
          <Button
            title="Undo last hand"
            variant="ghost"
            size="md"
            onPress={onUndo}
            disabled={activeGame.hands.length === 0}
            style={{ flex: 1 }}
          />
          <Button title="End game" variant="danger" size="md" onPress={() => navigation.navigate('EndGame')} style={{ flex: 1 }} />
        </View>
      </View>

      {/* ——— Update chips (long-press reconcile) ——— */}
      <Modal visible={reconcileId !== null} transparent animationType="slide" onRequestClose={() => setReconcileId(null)}>
        <Pressable style={styles.backdrop} onPress={() => setReconcileId(null)} />
        <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
          <View style={[styles.sheet, { paddingBottom: insets.bottom + sp(5) }]}>
            <View style={styles.grabber} />
            {reconcilePlayer && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: sp(3) }}>
                  <PlayerAvatar player={reconcilePlayer} size={40} />
                  <View>
                    <Text style={type.heading}>Update chips — {reconcilePlayer.name}</Text>
                    <Text style={type.caption}>
                      Tracked stack: {fmtMoney(activeGame.stacks[reconcilePlayer.id] ?? 0)} · count their real chips
                    </Text>
                  </View>
                </View>
                <View style={{ marginTop: sp(5) }}>
                  <ChipTally counts={reconcileChips} onChange={setReconcileChips} />
                </View>
                <Button title="Update chips" onPress={onUpdateChips} style={{ marginTop: sp(5) }} />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ——— Game options ——— */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />
        <View style={styles.menuWrap} pointerEvents="box-none">
          <View style={[styles.menu, cardShadow]}>
            <Text style={[type.caption, { marginBottom: sp(2) }]}>
              Started {new Date(activeGame.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
              {activeGame.hands.length} hand{activeGame.hands.length === 1 ? '' : 's'} logged
            </Text>
            <Button title="Discard game" variant="danger" size="md" onPress={onDiscard} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingHorizontal: sp(4),
    paddingVertical: sp(2),
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  tableTotal: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  sectionLabel: {
    paddingHorizontal: sp(5),
    marginBottom: sp(2.5),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(2.5),
    paddingHorizontal: sp(5),
  },
  playerCard: {
    width: '48.5%',
    borderRadius: radius.lg,
    padding: sp(3),
  },
  playerName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  stack: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  bustTag: {
    color: colors.loss,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  potCard: {
    marginHorizontal: sp(5),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: sp(4),
  },
  lastHand: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: sp(5),
    marginTop: sp(3),
  },
  actions: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: sp(4),
    paddingTop: sp(3),
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.surface2,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: sp(5),
    paddingTop: sp(2),
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: sp(3),
  },
  menuWrap: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingHorizontal: sp(5),
  },
  menu: {
    width: 260,
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: sp(4),
  },
});
