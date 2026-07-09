import React from 'react';
import { Text, View } from 'react-native';
import { alpha, colors } from '../theme';
import { Player } from '../types';

interface Props {
  player: Pick<Player, 'name' | 'color' | 'emoji'>;
  size?: number;
}

/** Circular avatar: the player's emoji (or initials) inside their colour ring. */
export function PlayerAvatar({ player, size = 44 }: Props) {
  const initials = player.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: player.color,
        backgroundColor: alpha(player.color, 0.16),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {player.emoji ? (
        <Text style={{ fontSize: size * 0.48 }}>{player.emoji}</Text>
      ) : (
        <Text style={{ fontSize: size * 0.34, fontWeight: '800', color: colors.text }}>{initials || '?'}</Text>
      )}
    </View>
  );
}
