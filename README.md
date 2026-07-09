# ♠ Poker Night

A dark-mode poker leaderboard companion for cash-style home games — built for use **mid-game with cards in hand**. Logging the end of a hand takes **3 taps or fewer**: tap the winner → tally the pot with chip buttons → Save hand.

One codebase, iOS + Android (React Native + Expo). Everything is stored locally on the device — no accounts, no network.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS with Expo Go installed), or press `a` / `i` for an emulator/simulator.

## What's inside

| Screen | What it does |
|---|---|
| **Players** (home) | Grid of colour-tinted player cards (lifetime net $, games won), add player (name + colour + avatar), Start New Game. Tap a card for that player's summary. |
| **Start New Game** | Pick the table, enter buy-ins with the chip tally — with a "same buy-in for everyone" shortcut. |
| **In-Game** | The critical screen. Hand number, live tracked stacks, ≤3-tap hand logging with split-pot support, **Skip** and **Undo last hand** always one tap away, long-press any player to reconcile their chips ("Update chips"), End game. |
| **End Game** | Final chips per player, **pre-filled from tracked stacks** so the common case is just confirming. Net results computed, winner declared with confetti, leaderboard updated. |
| **Leaderboard** | All-time / last-10 ranking by total net profit, podium styling for the top 3, games played / won / win rate. |
| **Player Summary** | Cumulative net profit chart in the player's colour, per-game history, biggest win, average per game. Archive / delete lives here. |
| **Performance** | One multi-series chart — every player's line in their card colour, per-game or cumulative, tap points for the full table that night. |

## Design decisions

- **Dark only.** Near-black `#0A0A0D` plane, elevated surfaces, one gold accent. The OS theme setting is ignored; status bar and Android navigation bar are styled to match. There is no light theme to fall back into.
- **Chips are the only input.** $1 / $5 / $10 / $20 — tap to add, long-press or the small minus to remove. Nobody ever types a dollar amount; the app does all the math (including split pots — odd $1 chips go to the earliest-selected winner).
- **No confirmation dialogs for routine actions.** Destructive-ish things (archive, delete, discard game, chip reconcile) show an **Undo** toast instead.
- **Crash-safe.** The full store (players, finished games, the in-progress game) persists to AsyncStorage on every change. Kill the app mid-game; reopening lands you back on the in-game screen exactly where you were.
- **Stats update only at game end.** The leaderboard and graphs never move mid-game.
- **Charts** are `react-native-gifted-charts` on `react-native-svg`, themed for the dark surface. The 10 player colours were validated with a palette checker (lightness band, chroma floor, ≥3:1 contrast on the dark surface); colour is never the only identity channel — names, avatars, legends and tooltips ride along.

## Project layout

```
App.tsx                     app shell: dark status/navigation bar, store hydration gate
src/
  theme.ts                  colours (incl. validated player palette), spacing, type scale
  types.ts                  Player / Game / Hand / ChipCounts
  store/useStore.ts         zustand + AsyncStorage persistence, all game actions
  lib/                      chip math, money formatting, stats/leaderboard/series, haptics
  navigation/               root stack + bottom tabs (dark theme)
  components/               ChipTally, Button, Toast (undo), AddPlayerSheet, Confetti…
    charts/                 CumulativeChart, PerformanceChart + shared chart chrome
  screens/                  Players, StartGame, InGame, EndGame, GameResult,
                            Leaderboard, PlayerSummary, Performance
scripts/make-assets.js      regenerates the poker-chip icon/splash PNGs (no deps)
```

## Data model

- **Player** — id, name, card colour, optional avatar emoji, archived flag. Removing a player with game history **archives** them (stats and graphs retained); hard delete is only offered when they've never played.
- **Game** — date, players, buy-ins, ordered hands, live tracked stacks, final chips, computed net per player, winner(s).
- **Hand** — winner(s), pot as chip counts + auto-calculated total, per-winner shares (so Undo is exact), or marked skipped.
