import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { success, tap } from '../lib/haptics';
import { useStore } from '../store/useStore';
import { AVATAR_EMOJIS, colors, PLAYER_COLORS, radius, sp, type } from '../theme';
import { Button } from './Button';
import { showToast } from './Toast';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddPlayerSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const players = useStore((s) => s.players);
  const addPlayer = useStore((s) => s.addPlayer);

  const [name, setName] = useState('');
  const [color, setColor] = useState(PLAYER_COLORS[0].hex);
  const [emoji, setEmoji] = useState<string | undefined>(undefined);

  // Default to the least-used colour so cards stay distinct.
  const defaultColor = useMemo(() => {
    const usage = new Map<string, number>(PLAYER_COLORS.map((c) => [c.hex, 0]));
    for (const p of players) usage.set(p.color, (usage.get(p.color) ?? 0) + 1);
    let best = PLAYER_COLORS[0].hex;
    let bestCount = Infinity;
    for (const c of PLAYER_COLORS) {
      const n = usage.get(c.hex) ?? 0;
      if (n < bestCount) {
        best = c.hex;
        bestCount = n;
      }
    }
    return best;
  }, [players]);

  useEffect(() => {
    if (visible) {
      setName('');
      setColor(defaultColor);
      setEmoji(undefined);
    }
  }, [visible, defaultColor]);

  const trimmed = name.trim();
  const duplicate = trimmed.length > 0 && players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());

  const add = () => {
    if (!trimmed) return;
    const player = addPlayer(trimmed, color, emoji);
    success();
    onClose();
    showToast({ message: `${player.name} joined the table` });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} pointerEvents="box-none" style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + sp(5) }]}>
          <View style={styles.grabber} />
          <Text style={styles.title}>New player</Text>

          <Text style={[type.label, styles.fieldLabel]}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Sam"
            placeholderTextColor={colors.textMuted}
            autoFocus
            maxLength={24}
            returnKeyType="done"
            onSubmitEditing={add}
            style={styles.input}
            selectionColor={colors.gold}
          />
          {duplicate && (
            <Text style={styles.dupWarning}>
              You already have a player named “{trimmed}”. You can still add them — the colour and avatar will tell
              them apart.
            </Text>
          )}

          <Text style={[type.label, styles.fieldLabel]}>Card colour</Text>
          <View style={styles.swatchGrid}>
            {PLAYER_COLORS.map((c) => {
              const active = c.hex === color;
              return (
                <Pressable
                  key={c.hex}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name} colour`}
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    tap();
                    setColor(c.hex);
                  }}
                  style={[styles.swatchRing, active && { borderColor: colors.text }]}
                >
                  <View style={[styles.swatch, { backgroundColor: c.hex }]} />
                </Pressable>
              );
            })}
          </View>

          <Text style={[type.label, styles.fieldLabel]}>Avatar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: sp(4) }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="No avatar"
              onPress={() => {
                tap();
                setEmoji(undefined);
              }}
              style={[styles.emojiCell, emoji === undefined && styles.emojiCellActive]}
            >
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>None</Text>
            </Pressable>
            {AVATAR_EMOJIS.map((e) => (
              <Pressable
                key={e}
                accessibilityRole="button"
                accessibilityLabel={`Avatar ${e}`}
                onPress={() => {
                  tap();
                  setEmoji(e);
                }}
                style={[styles.emojiCell, emoji === e && styles.emojiCellActive]}
              >
                <Text style={{ fontSize: 24 }}>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Button title="Add player" onPress={add} disabled={!trimmed} style={{ marginTop: sp(5) }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: sp(5),
    paddingTop: sp(2),
    borderWidth: 1,
    borderColor: colors.border,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: sp(3),
  },
  title: {
    ...type.title,
    marginBottom: sp(2),
  },
  fieldLabel: {
    marginTop: sp(4),
    marginBottom: sp(2),
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: sp(4),
    height: 52,
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  dupWarning: {
    marginTop: sp(2),
    color: colors.warning,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(2.5),
  },
  swatchRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  emojiCell: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: sp(2),
  },
  emojiCellActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldDim,
  },
});
