import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, sp } from '../theme';
import { Button } from './Button';

interface Props {
  glyph: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** An empty screen is an invitation to act. */
export function EmptyState({ glyph, title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.glyphRing}>
        <Text style={styles.glyph}>{glyph}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: sp(6), alignSelf: 'center', minWidth: 220 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp(10),
    paddingBottom: sp(10),
  },
  glyphRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp(5),
  },
  glyph: {
    fontSize: 42,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: sp(2),
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
