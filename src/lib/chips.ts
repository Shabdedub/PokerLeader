import { ChipCounts, DENOMS, Denom } from '../types';

export function emptyChips(): ChipCounts {
  return { 1: 0, 5: 0, 10: 0, 20: 0 };
}

export function chipTotal(c: ChipCounts): number {
  return DENOMS.reduce((sum, d) => sum + d * (c[d] || 0), 0);
}

export function chipCount(c: ChipCounts): number {
  return DENOMS.reduce((sum, d) => sum + (c[d] || 0), 0);
}

/** Greedy breakdown of a dollar amount into the four denominations. */
export function breakdown(amount: number): ChipCounts {
  let rest = Math.max(0, Math.round(amount));
  const out = emptyChips();
  for (const d of [...DENOMS].reverse() as Denom[]) {
    out[d] = Math.floor(rest / d);
    rest -= out[d] * d;
  }
  return out;
}

/** Classic casino colours per denomination (distinct from player colours). */
export const CHIP_META: Record<Denom, { color: string; label: string }> = {
  1: { color: '#E8E2D0', label: '$1' },
  5: { color: '#E05252', label: '$5' },
  10: { color: '#5B8FE8', label: '$10' },
  20: { color: '#3FA96B', label: '$20' },
};
