import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { tap } from '../lib/haptics';
import { alpha, colors, radius } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'lg' | 'md' | 'sm';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  /** Fires a light haptic on press (default true). */
  haptic?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

/** Large-target button. Labels always say exactly what the button does. */
export function Button({ title, onPress, variant = 'primary', size = 'lg', disabled, haptic = true, style, icon }: Props) {
  const height = size === 'lg' ? 56 : size === 'md' ? 46 : 38;

  const base: Record<Variant, { container: ViewStyle; label: TextStyle }> = {
    primary: {
      container: { backgroundColor: colors.gold },
      label: { color: colors.onGold },
    },
    secondary: {
      container: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong },
      label: { color: colors.text },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      label: { color: colors.gold },
    },
    danger: {
      container: { backgroundColor: alpha(colors.loss, 0.14), borderWidth: 1, borderColor: alpha(colors.loss, 0.4) },
      label: { color: '#F08A8A' },
    },
  };

  const v = base[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={() => {
        if (haptic) tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.container,
        { height, borderRadius: size === 'sm' ? radius.sm : radius.md },
        v.container,
        pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
        disabled && { opacity: 0.35 },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          { fontSize: size === 'lg' ? 17 : size === 'md' ? 15 : 14 },
          v.label,
          icon ? { marginLeft: 8 } : null,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
