import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CHIP_META, chipTotal, emptyChips } from '../lib/chips';
import { tap, thud } from '../lib/haptics';
import { fmtMoney } from '../lib/money';
import { alpha, colors, radius, sp, type } from '../theme';
import { ChipCounts, DENOMS, Denom } from '../types';

interface Props {
  counts: ChipCounts;
  onChange: (next: ChipCounts) => void;
  /** Smaller chips for dense lists (End Game screen). */
  compact?: boolean;
  /** Hide the total row (when the caller renders its own total). */
  hideTotal?: boolean;
}

/**
 * The one reusable chip entry control. Four big chip buttons — tap to add one,
 * long-press (or the small minus) to remove one. Users never type dollar
 * amounts; the total is always computed.
 */
export function ChipTally({ counts, onChange, compact, hideTotal }: Props) {
  const size = compact ? 54 : 68;
  const total = chipTotal(counts);
  const [focusedDenom, setFocusedDenom] = useState<Denom | null>(null);

  const bump = (d: Denom, delta: 1 | -1) => {
    const next = { ...counts, [d]: Math.max(0, (counts[d] || 0) + delta) };
    if (delta === 1) tap();
    else thud();
    onChange(next);
  };

  // Typed counts: digits only, capped at 999 chips per denomination.
  const setCount = (d: Denom, text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 3);
    onChange({ ...counts, [d]: digits === '' ? 0 : parseInt(digits, 10) });
  };

  return (
    <View>
      <View style={styles.row}>
        {DENOMS.map((d) => {
          const meta = CHIP_META[d];
          const count = counts[d] || 0;
          return (
            <View key={d} style={styles.col}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add one ${meta.label} chip`}
                accessibilityHint="Long press to remove one"
                onPress={() => bump(d, 1)}
                onLongPress={() => count > 0 && bump(d, -1)}
                delayLongPress={320}
                style={({ pressed }) => [
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: 4,
                    borderStyle: 'dashed',
                    borderColor: meta.color,
                    backgroundColor: alpha(meta.color, count > 0 ? 0.2 : 0.08),
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  pressed && { transform: [{ scale: 0.92 }] },
                ]}
              >
                <Text
                  style={{
                    color: meta.color,
                    fontWeight: '800',
                    fontSize: compact ? 14 : 16,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {meta.label}
                </Text>
              </Pressable>

              <TextInput
                accessibilityLabel={`${meta.label} chip count, type a number`}
                value={String(count)}
                onChangeText={(text) => setCount(d, text)}
                onFocus={() => setFocusedDenom(d)}
                onBlur={() => setFocusedDenom(null)}
                keyboardType="number-pad"
                selectTextOnFocus
                maxLength={3}
                style={[
                  styles.countInput,
                  {
                    color: count > 0 ? colors.text : colors.textMuted,
                    fontSize: compact ? 13 : 15,
                    borderColor: focusedDenom === d ? colors.gold : colors.border,
                  },
                ]}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove one ${meta.label} chip`}
                disabled={count === 0}
                onPress={() => bump(d, -1)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.minus,
                  count === 0 && { opacity: 0.25 },
                  pressed && { backgroundColor: colors.surface3 },
                ]}
              >
                <Text style={styles.minusLabel}>−</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      {!hideTotal && (
        <View style={styles.totalRow}>
          <Text style={type.label}>Total</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {total > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear chips"
                onPress={() => {
                  thud();
                  onChange(emptyChips());
                }}
                hitSlop={10}
                style={{ marginRight: sp(4), paddingVertical: 4, paddingHorizontal: 8 }}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 13 }}>Clear</Text>
              </Pressable>
            )}
            <Text
              style={[
                type.money,
                { fontSize: compact ? 20 : 26, color: total > 0 ? colors.gold : colors.textMuted },
              ]}
            >
              {fmtMoney(total)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    alignItems: 'center',
    flex: 1,
  },
  countInput: {
    marginTop: sp(2),
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    minWidth: 52,
    height: 32,
    paddingVertical: 0,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
  },
  minus: {
    marginTop: sp(1),
    width: 40,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  minusLabel: {
    color: colors.textSecondary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  totalRow: {
    marginTop: sp(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
