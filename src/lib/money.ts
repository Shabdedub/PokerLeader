import { colors } from '../theme';

function thousands(n: number): string {
  return Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** "$1,240" / "-$25" */
export function fmtMoney(n: number): string {
  return `${n < 0 ? '-' : ''}$${thousands(n)}`;
}

/** Signed form for results: "+$40" / "-$25" / "$0" */
export function fmtNet(n: number): string {
  if (n > 0) return `+$${thousands(n)}`;
  if (n < 0) return `-$${thousands(n)}`;
  return '$0';
}

export function netColor(n: number): string {
  if (n > 0) return colors.profit;
  if (n < 0) return colors.loss;
  return colors.textMuted;
}
