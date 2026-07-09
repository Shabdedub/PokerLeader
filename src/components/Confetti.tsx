import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { colors, PLAYER_COLORS } from '../theme';

const PIECE_COLORS = [colors.gold, colors.goldBright, ...PLAYER_COLORS.map((c) => c.hex)];
const COUNT = 42;

interface PieceSpec {
  x: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  sway: number;
  spin: number;
  round: boolean;
}

/** One-shot celebratory confetti (native-driver transforms only — 60fps). */
export function Confetti() {
  const { width, height } = Dimensions.get('window');
  const progress = useRef(new Animated.Value(0)).current;

  const pieces = useMemo<PieceSpec[]>(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        x: Math.random() * width,
        size: 7 + Math.random() * 7,
        color: PIECE_COLORS[i % PIECE_COLORS.length],
        delay: Math.random() * 0.35,
        duration: 0.55 + Math.random() * 0.45,
        sway: (Math.random() - 0.5) * 90,
        spin: (Math.random() - 0.5) * 8,
        round: Math.random() > 0.5,
      })),
    [width]
  );

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 4200,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => {
        const start = p.delay;
        const end = Math.min(1, p.delay + p.duration);
        const translateY = progress.interpolate({
          inputRange: [0, start, end, 1],
          outputRange: [-40, -40, height + 60, height + 60],
        });
        const translateX = progress.interpolate({
          inputRange: [0, start, (start + end) / 2, end, 1],
          outputRange: [0, 0, p.sway, 0, 0],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spin * 360}deg`],
        });
        const opacity = progress.interpolate({
          inputRange: [0, start, end - 0.08, end, 1],
          outputRange: [0, 1, 1, 0, 0],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: 0,
              width: p.size,
              height: p.round ? p.size : p.size * 1.7,
              borderRadius: p.round ? p.size / 2 : 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
