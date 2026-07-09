import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardShadow, colors, radius, sp } from '../theme';

export interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

type Listener = (opts: ToastOptions) => void;
let listener: Listener | null = null;

/** Show a toast from anywhere. Undo lives here — never a confirmation dialog. */
export function showToast(opts: ToastOptions) {
  listener?.(opts);
}

/** Mount once at the app root, above navigation. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [anim]);

  useEffect(() => {
    listener = (opts) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast(opts);
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      hideTimer.current = setTimeout(hide, opts.duration ?? 4500);
    };
    return () => {
      listener = null;
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [anim, hide]);

  if (!toast) return null;

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}>
      <Animated.View
        style={[
          styles.toast,
          cardShadow,
          {
            marginBottom: insets.bottom + sp(24),
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
        {toast.actionLabel && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={toast.actionLabel}
            hitSlop={12}
            onPress={() => {
              toast.onAction?.();
              hide();
            }}
            style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.actionLabel}>{toast.actionLabel}</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    marginHorizontal: sp(5),
    backgroundColor: colors.surface3,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: sp(3.5),
    paddingHorizontal: sp(4),
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  action: {
    marginLeft: sp(3),
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.goldDim,
  },
  actionLabel: {
    color: colors.goldBright,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
