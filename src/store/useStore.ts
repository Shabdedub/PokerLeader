import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { chipTotal } from '../lib/chips';
import { uid } from '../lib/id';
import { ChipCounts, Game, Hand, Player } from '../types';

interface PokerState {
  players: Player[];
  /** Finished games. */
  games: Game[];
  /** The in-progress game — persisted on every change so a killed app restores exactly. */
  activeGame: Game | null;
  hydrated: boolean;

  setHydrated: () => void;

  addPlayer: (name: string, color: string, emoji?: string) => Player;
  archivePlayer: (id: string) => void;
  unarchivePlayer: (id: string) => void;
  /** Hard delete — only allowed for players with no game history. */
  deletePlayer: (id: string) => Player | null;
  /** Undo for a hard delete. */
  restorePlayer: (player: Player) => void;

  startGame: (playerIds: string[], buyIns: Record<string, number>) => void;
  saveHand: (winnerIds: string[], pot: ChipCounts) => Hand | null;
  skipHand: () => Hand | null;
  undoLastHand: () => Hand | null;
  /** Long-press reconciliation: overwrite one player's tracked stack with reality. */
  updateChips: (playerId: string, chips: ChipCounts) => void;
  endGame: (finalStacks: Record<string, number>) => Game | null;
  discardGame: () => Game | null;
  /** Undo for a discarded game. */
  restoreGame: (game: Game) => void;
}

export const useStore = create<PokerState>()(
  persist(
    (set, get) => ({
      players: [],
      games: [],
      activeGame: null,
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

      addPlayer: (name, color, emoji) => {
        const player: Player = {
          id: uid(),
          name: name.trim(),
          color,
          emoji,
          archived: false,
          createdAt: Date.now(),
        };
        set({ players: [...get().players, player] });
        return player;
      },

      archivePlayer: (id) =>
        set({ players: get().players.map((p) => (p.id === id ? { ...p, archived: true } : p)) }),

      unarchivePlayer: (id) =>
        set({ players: get().players.map((p) => (p.id === id ? { ...p, archived: false } : p)) }),

      deletePlayer: (id) => {
        const { players, games, activeGame } = get();
        const hasHistory =
          games.some((g) => g.playerIds.includes(id)) || (activeGame?.playerIds.includes(id) ?? false);
        if (hasHistory) return null;
        const player = players.find((p) => p.id === id) ?? null;
        if (player) set({ players: players.filter((p) => p.id !== id) });
        return player;
      },

      restorePlayer: (player) => set({ players: [...get().players, player] }),

      startGame: (playerIds, buyIns) => {
        const stacks: Record<string, number> = {};
        for (const id of playerIds) stacks[id] = buyIns[id] ?? 0;
        set({
          activeGame: {
            id: uid(),
            startedAt: Date.now(),
            playerIds: [...playerIds],
            buyIns: { ...buyIns },
            hands: [],
            stacks,
          },
        });
      },

      saveHand: (winnerIds, pot) => {
        const g = get().activeGame;
        if (!g || winnerIds.length === 0) return null;
        const total = chipTotal(pot);
        // Split pots divide equally; odd $1 chips go to the earliest-selected winners.
        const base = Math.floor(total / winnerIds.length);
        let remainder = total - base * winnerIds.length;
        const shares: Record<string, number> = {};
        for (const id of winnerIds) {
          shares[id] = base + (remainder > 0 ? 1 : 0);
          if (remainder > 0) remainder -= 1;
        }
        const hand: Hand = {
          id: uid(),
          skipped: false,
          winnerIds: [...winnerIds],
          pot: { ...pot },
          potTotal: total,
          shares,
          at: Date.now(),
        };
        const stacks = { ...g.stacks };
        for (const id of winnerIds) stacks[id] = (stacks[id] ?? 0) + shares[id];
        set({ activeGame: { ...g, hands: [...g.hands, hand], stacks } });
        return hand;
      },

      skipHand: () => {
        const g = get().activeGame;
        if (!g) return null;
        const hand: Hand = {
          id: uid(),
          skipped: true,
          winnerIds: [],
          pot: { 1: 0, 5: 0, 10: 0, 20: 0 },
          potTotal: 0,
          shares: {},
          at: Date.now(),
        };
        set({ activeGame: { ...g, hands: [...g.hands, hand] } });
        return hand;
      },

      undoLastHand: () => {
        const g = get().activeGame;
        if (!g || g.hands.length === 0) return null;
        const hand = g.hands[g.hands.length - 1];
        const stacks = { ...g.stacks };
        if (!hand.skipped) {
          for (const id of hand.winnerIds) stacks[id] = (stacks[id] ?? 0) - (hand.shares[id] ?? 0);
        }
        set({ activeGame: { ...g, hands: g.hands.slice(0, -1), stacks } });
        return hand;
      },

      updateChips: (playerId, chips) => {
        const g = get().activeGame;
        if (!g) return;
        set({ activeGame: { ...g, stacks: { ...g.stacks, [playerId]: chipTotal(chips) } } });
      },

      endGame: (finalStacks) => {
        const g = get().activeGame;
        if (!g) return null;
        const results: Record<string, number> = {};
        for (const id of g.playerIds) results[id] = (finalStacks[id] ?? 0) - (g.buyIns[id] ?? 0);
        const best = Math.max(...g.playerIds.map((id) => results[id]));
        const winnerIds = g.playerIds.filter((id) => results[id] === best);
        const finished: Game = {
          ...g,
          endedAt: Date.now(),
          finalStacks: { ...finalStacks },
          results,
          winnerIds,
        };
        set({ games: [...get().games, finished], activeGame: null });
        return finished;
      },

      discardGame: () => {
        const g = get().activeGame;
        if (!g) return null;
        set({ activeGame: null });
        return g;
      },

      restoreGame: (game) => set({ activeGame: game }),
    }),
    {
      name: 'poker-night-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (s) => ({ players: s.players, games: s.games, activeGame: s.activeGame }),
      onRehydrateStorage: () => () => {
        useStore.getState().setHydrated();
      },
    }
  )
);
