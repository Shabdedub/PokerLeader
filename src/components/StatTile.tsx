import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, sp, type } from '../theme';

interface Props {
  label: string;
  value: string;
  valueColor?: string;
  style?: ViewStyle;
}

export function StatTile({ label, value, valueColor = colors.text, style }: Props) {
  return (
    <View style={[styles.tile, style]}>
      <Text style={[type.label, { fontSize: 11 }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.value, { color: valueColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: sp(3.5),
    paddingHorizontal: sp(3.5),
  },
  value: {
    marginTop: sp(1.5),
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
});
