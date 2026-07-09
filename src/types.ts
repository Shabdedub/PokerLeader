/** Chip denominations available in the game. Exactly four: $1, $5, $10, $20. */
export const DENOMS = [1, 5, 10, 20] as const;
export type Denom = (typeof DENOMS)[number];

/** Per-denomination chip counts. All money in the app derives from these. */
export type ChipCounts = Record<Denom, number>;

export interface Player {
  id: string;
  name: string;
  /** Card tint colour, chosen at setup. */
  color: string;
  /** Optional avatar emoji. */
  emoji?: string;
  /** Archived players keep stats/graphs but leave the home grid and new games. */
  archived: boolean;
  createdAt: number;
}

export interface Hand {
  id: string;
  /** True when the table forgot to log the hand. */
  skipped: boolean;
  /** Winner ids in selection order (order decides who gets odd $1 chips on splits). */
  winnerIds: string[];
  pot: ChipCounts;
  potTotal: number;
  /** Exact dollars credited per winner — makes Undo exact even on split pots. */
  shares: Record<string, number>;
  at: number;
}

export interface Game {
  id: string;
  startedAt: number;
  endedAt?: number;
  playerIds: string[];
  /** Starting chips ($) per player. */
  buyIns: Record<string, number>;
  hands: Hand[];
  /** Live tracked stack ($) per player, updated on every saved hand / reconcile. */
  stacks: Record<string, number>;
  /** Set at game end. */
  finalStacks?: Record<string, number>;
  /** Net result ($) per player: final − buy-in. */
  results?: Record<string, number>;
  /** Player(s) with the best net result. */
  winnerIds?: string[];
}
