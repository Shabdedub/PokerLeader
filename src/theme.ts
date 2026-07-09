import { TextStyle, ViewStyle } from 'react-native';

/**
 * Poker Night is dark-mode only. There is deliberately no light palette,
 * and nothing reads the OS theme setting.
 */
export const colors = {
  /** Near-black, OLED-friendly page plane. */
  bg: '#0A0A0D',
  /** Elevated card surface. */
  surface: '#141419',
  /** Higher elevation: modals, chips, inputs. */
  surface2: '#1C1C24',
  /** Pressed / selected wash. */
  surface3: '#24242E',

  text: '#F4F3EF',
  textSecondary: '#C3C2B7',
  textMuted: '#8B8A82',

  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',

  /** The single accent: deep casino gold. */
  gold: '#D9B45B',
  goldBright: '#EACD85',
  goldDim: 'rgba(217,180,91,0.16)',
  /** Ink used on top of gold fills. */
  onGold: '#191305',

  /** Money up / money down (status colours — never reused as series colours). */
  profit: '#0CA30C',
  loss: '#D03B3B',
  warning: '#FAB219',

  /** Chart chrome. */
  grid: 'rgba(255,255,255,0.07)',
  axis: '#34343C',

  podiumGold: '#D9B45B',
  podiumSilver: '#AEB4BF',
  podiumBronze: '#B0813F',
} as const;

/**
 * Player card colours. Validated (dataviz six-checks) against the dark surface:
 * lightness band, chroma floor, ≥3:1 contrast. CVD separation sits in the
 * floor band, which is legal because every use pairs colour with a name,
 * avatar, legend or tooltip (secondary encoding).
 */
export const PLAYER_COLORS: { name: string; hex: string }[] = [
  { name: 'Blue', hex: '#3987E5' },
  { name: 'Amber', hex: '#C98500' },
  { name: 'Violet', hex: '#9085E9' },
  { name: 'Jade', hex: '#199E70' },
  { name: 'Coral', hex: '#E66767' },
  { name: 'Cyan', hex: '#1D9DB2' },
  { name: 'Magenta', hex: '#D55181' },
  { name: 'Green', hex: '#008300' },
  { name: 'Ember', hex: '#D95926' },
  { name: 'Bronze', hex: '#B0813F' },
];

export const AVATAR_EMOJIS = ['🦈', '🃏', '🎩', '🦊', '🐯', '🍀', '🎲', '🔥', '🐺', '👑', '💎', '🥃', '🦅', '🌵', '⚡', '🐙'];

/** 4-pt spacing scale. */
export const sp = (n: number) => n * 4;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

/** Subtle depth for elevated cards on the near-black plane. */
export const cardShadow: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 14,
  elevation: 6,
};

/** Type scale. System sans everywhere; tabular figures for aligned money. */
export const type = {
  display: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -0.6 } as TextStyle,
  title: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 } as TextStyle,
  heading: { fontSize: 17, fontWeight: '700', color: colors.text } as TextStyle,
  body: { fontSize: 15, fontWeight: '400', color: colors.textSecondary, lineHeight: 21 } as TextStyle,
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } as TextStyle,
  caption: { fontSize: 12, fontWeight: '500', color: colors.textMuted } as TextStyle,
  money: { fontVariant: ['tabular-nums'], fontWeight: '700' } as TextStyle,
} as const;

/** Convenience: hex colour + alpha (0–1). */
export function alpha(hex: string, a: number): string {
  const v = Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${v}`;
}
