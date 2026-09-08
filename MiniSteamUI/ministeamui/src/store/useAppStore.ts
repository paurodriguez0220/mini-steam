import { create } from "zustand";
import type { GameMetric, GameScoreMessage } from "../../../../shared/game-score";

export type Game = {
  id: number;
  title: string;
  description: string;
  category: string;
  iconPath: string;
  url: string;
};

/** One row of a per-game leaderboard, as returned by GET /api/scores/leaderboard. */
export type LeaderboardEntry = {
  rank: number;
  scoreId: number;
  userId: number;
  playerName: string;
  value: number;
  difficulty: string | null;
  outcome: string;
  achievedAt: string;
};

export type Leaderboard = {
  gameId: number;
  gameTitle: string;
  metricKind: "points" | "seconds";
  betterIs: "higher" | "lower";
  difficulty: string | null;
  limit: number;
  entries: LeaderboardEntry[];
};

type AppState = {
  token: string | null;
  data: unknown;
  games: Game[] | null;
  loading: boolean;
  /** The metric an embedded game is currently reporting, for the live HUD. */
  liveMetric: GameMetric | null;
  /** Leaderboards by cache key, from `leaderboardKey`. */
  leaderboards: Record<string, Leaderboard>;
  setToken: (token: string) => void;
  setData: (data: unknown) => void;
  setGames: (games: Game[]) => void;
  setLoading: (loading: boolean) => void;
  setLiveMetric: (metric: GameMetric | null) => void;
  fetchToken: () => Promise<void>;
  fetchData: () => Promise<void>;
  fetchGames: () => Promise<void>;
  submitScore: (message: GameScoreMessage) => Promise<void>;
  fetchLeaderboard: (gameId: number, difficulty?: string) => Promise<void>;
};

const API_URL = import.meta.env.VITE_API_URL;
const API_AUTH_USERNAME = import.meta.env.VITE_API_AUTH_USERNAME;
const API_AUTH_PASSWORD = import.meta.env.VITE_API_AUTH_PASSWORD;

/** Stable cache key for a leaderboard, since difficulty is optional. */
export function leaderboardKey(gameId: number, difficulty?: string): string {
  return difficulty ? `${gameId}:${difficulty}` : `${gameId}`;
}

export const useAppStore = create<AppState>((set, get) => ({
  token: null,
  data: null,
  games: null,
  loading: false,
  liveMetric: null,
  leaderboards: {},

  setToken: (token) => set({ token }),
  setData: (data) => set({ data }),
  setGames: (games) => set({ games }),
  setLoading: (loading) => set({ loading }),
  setLiveMetric: (liveMetric) => set({ liveMetric }),

  // Fetch token once
  fetchToken: async () => {
    if (get().token) return; // already have token

    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Credentials go in the body - never in the URL.
        body: JSON.stringify({
          email: API_AUTH_USERNAME,
          password: API_AUTH_PASSWORD,
        }),
      });

      if (!res.ok) throw new Error("Token request failed");

      const json = await res.json();
      set({ token: json.token });
    } catch (err) {
      console.error("Failed to fetch token:", err);
    } finally {
      set({ loading: false });
    }
  },

  // Fetch API data using the token
  fetchData: async () => {
    const token = get().token;
    if (!token) {
      console.warn("No token yet");
      return;
    }

    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Data request failed");

      const json = await res.json();
      set({ data: json });
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      set({ loading: false });
    }
  },

  // Fetch games from API
  fetchGames: async () => {
    if (get().games) return; // already have games

    const token = get().token;
    if (!token) {
      console.warn("No token yet");
      return;
    }

    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/api/games`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Games request failed");

      const json = await res.json();
      set({ games: json });
    } catch (err) {
      console.error("Failed to fetch games:", err);
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Record a finished run.
   *
   * The message identifies its game by slug, but the API keys scores on the
   * database id, so the slug is resolved against the catalogue by title. The
   * nested `metric` is flattened onto the request; `metric.label` is display
   * text and is deliberately not persisted.
   */
  submitScore: async (message) => {
    const { token, games } = get();
    if (!token) {
      console.warn("No token yet; score not recorded");
      return;
    }

    const game = games?.find((entry) => entry.title.toLowerCase() === message.game);
    if (!game) {
      console.warn(`No catalogue game matches "${message.game}"; score not recorded`);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gameId: game.id,
          metricKind: message.metric.kind,
          value: Math.round(message.metric.value),
          betterIs: message.metric.betterIs,
          difficulty: message.difficulty ?? null,
          outcome: message.outcome ?? "lost",
        }),
      });

      if (!res.ok) throw new Error(`Score request failed with ${res.status}`);

      // The board just changed, so drop the cached copy and refetch it.
      await get().fetchLeaderboard(game.id, message.difficulty);
    } catch (err) {
      console.error("Failed to record score:", err);
    }
  },

  fetchLeaderboard: async (gameId, difficulty) => {
    const token = get().token;
    if (!token) {
      console.warn("No token yet");
      return;
    }

    const query = new URLSearchParams({ gameId: String(gameId) });
    if (difficulty) query.set("difficulty", difficulty);

    try {
      const res = await fetch(`${API_URL}/api/scores/leaderboard?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Leaderboard request failed with ${res.status}`);

      const json: Leaderboard = await res.json();
      set((state) => ({
        leaderboards: { ...state.leaderboards, [leaderboardKey(gameId, difficulty)]: json },
      }));
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    }
  },
}));
