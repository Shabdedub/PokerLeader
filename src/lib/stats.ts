import { Game, Player } from '../types';

export type GameFilter = 'all' | 'last10';

/** Finished games in date order (oldest → newest). */
export function gamesByDate(games: Game[]): Game[] {
  return [...games].sort((a, b) => (a.endedAt ?? a.startedAt) - (b.endedAt ?? b.startedAt));
}

export function filterGames(games: Game[], filter: GameFilter): Game[] {
  const ordered = gamesByDate(games);
  return filter === 'last10' ? ordered.slice(-10) : ordered;
}

export interface LeaderboardRow {
  player: Player;
  net: number;
  gamesPlayed: number;
  gamesWon: number;
  handsWon: number;
  winRate: number; // 0–1
}

/** Hands this player won within the given games (skipped hands never count). */
export function handsWonIn(playerId: string, games: Game[]): number {
  return games.reduce(
    (sum, g) => sum + g.hands.filter((h) => h.winnerIds.includes(playerId)).length,
    0
  );
}

/** All-time (or filtered) ranking by total net profit. */
export function leaderboardRows(players: Player[], games: Game[], filter: GameFilter): LeaderboardRow[] {
  const set = filterGames(games, filter);
  const rows: LeaderboardRow[] = [];
  for (const player of players) {
    const played = set.filter((g) => g.playerIds.includes(player.id));
    if (played.length === 0) continue;
    const net = played.reduce((sum, g) => sum + (g.results?.[player.id] ?? 0), 0);
    const gamesWon = played.filter((g) => g.winnerIds?.includes(player.id)).length;
    rows.push({
      player,
      net,
      gamesPlayed: played.length,
      gamesWon,
      handsWon: handsWonIn(player.id, played),
      winRate: gamesWon / played.length,
    });
  }
  rows.sort((a, b) => b.net - a.net || b.gamesWon - a.gamesWon || a.player.name.localeCompare(b.player.name));
  return rows;
}

export interface LifetimeStats {
  net: number;
  gamesPlayed: number;
  gamesWon: number;
  handsWon: number;
}

export function lifetimeStats(playerId: string, games: Game[]): LifetimeStats {
  const played = games.filter((g) => g.playerIds.includes(playerId));
  return {
    net: played.reduce((sum, g) => sum + (g.results?.[playerId] ?? 0), 0),
    gamesPlayed: played.length,
    gamesWon: played.filter((g) => g.winnerIds?.includes(playerId)).length,
    handsWon: handsWonIn(playerId, played),
  };
}

export interface PlayerGameResult {
  game: Game;
  date: number;
  net: number;
  cumulative: number;
  won: boolean;
}

/** One player's per-game results in date order, with running cumulative net. */
export function playerResults(playerId: string, games: Game[]): PlayerGameResult[] {
  const played = gamesByDate(games).filter((g) => g.playerIds.includes(playerId));
  let running = 0;
  return played.map((game) => {
    const net = game.results?.[playerId] ?? 0;
    running += net;
    return {
      game,
      date: game.endedAt ?? game.startedAt,
      net,
      cumulative: running,
      won: game.winnerIds?.includes(playerId) ?? false,
    };
  });
}

export interface SeriesPoint {
  /** Index into the shared, date-ordered game list. */
  gameIndex: number;
  /** Null when the player sat this game out (except cumulative carry-forward). */
  value: number | null;
  /** False when the player sat this game out. */
  played: boolean;
}

export interface PlayerSeries {
  player: Player;
  points: SeriesPoint[];
}

/**
 * Per-player series aligned to the shared game axis (all finished games in
 * date order). Games a player sat out are null in per-game mode (the chart
 * interpolates the line and hides those markers); cumulative mode carries the
 * running total forward — an honest flat line — starting at their first game.
 */
export function performanceSeries(players: Player[], games: Game[], mode: 'perGame' | 'cumulative'): PlayerSeries[] {
  const ordered = gamesByDate(games);
  const out: PlayerSeries[] = [];

  for (const player of players) {
    if (!ordered.some((g) => g.playerIds.includes(player.id))) continue;

    const raw: (number | null)[] = ordered.map((g) =>
      g.playerIds.includes(player.id) ? g.results?.[player.id] ?? 0 : null
    );

    let values: (number | null)[];
    if (mode === 'cumulative') {
      let running = 0;
      let started = false;
      values = raw.map((v) => {
        if (v !== null) {
          running += v;
          started = true;
        }
        return started ? running : null;
      });
    } else {
      values = raw;
    }

    out.push({
      player,
      points: values.map((v, i) => ({ gameIndex: i, value: v, played: raw[i] !== null })),
    });
  }
  return out;
}

export function fmtDate(ts: number): string {
  const d = new Date(ts);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function fmtDateFull(ts: number): string {
  const d = new Date(ts);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
