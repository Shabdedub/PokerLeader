import { TextStyle } from 'react-native';
import { colors } from '../../theme';

/**
 * Shared chart chrome: recessive grid, muted axis ink, thin marks —
 * the series colour is the only loud thing on the plot.
 */
export const axisText: TextStyle = {
  color: colors.textMuted,
  fontSize: 11,
  fontVariant: ['tabular-nums'],
};

/** Compact "$" axis label: 1500 → $1.5k, -20 → -$20 */
export function fmtAxisMoney(v: number): string {
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  if (abs >= 1000) {
    const k = abs / 1000;
    return `${sign}$${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  return `${sign}$${Math.round(abs)}`;
}

export interface NiceRange {
  /** Axis floor (passed as yAxisOffset). */
  offset: number;
  /** Plotted span: axis ceiling − floor (passed as maxValue). */
  span: number;
  sections: number;
  step: number;
}

/** Round the value range out to tidy steps, always including zero. */
export function niceRange(values: number[], targetSections = 4): NiceRange {
  let min = Math.min(0, ...values);
  let max = Math.max(0, ...values);
  if (min === max) {
    min -= 10;
    max += 10;
  }
  const rawStep = (max - min) / targetSections;
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const candidates = [1, 2, 2.5, 5, 10].map((c) => c * pow);
  const step = candidates.find((c) => c >= rawStep) ?? candidates[candidates.length - 1];
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  return {
    offset: lo,
    span: hi - lo,
    sections: Math.max(1, Math.round((hi - lo) / step)),
    step,
  };
}

/** Sparse x labels: at most `maxLabels`, always including first and last. */
export function sparseLabels(labels: string[], maxLabels = 5): string[] {
  const n = labels.length;
  if (n <= maxLabels) return labels;
  const every = Math.ceil(n / maxLabels);
  return labels.map((l, i) => (i % every === 0 || i === n - 1 ? l : ''));
}
