import { create } from "zustand";

export type Game = {
  id: number;
  title: string;
  description: string;
  category: string;
  iconPath: string;
  url: string;
};

type AppState = {
  token: string | null;
  data: any | null;
  games: Game[] | null;
  loading: boolean;
  setToken: (token: string) => void;
  setData: (data: any) => void;
  setGames: (games: Game[]) => void;
  setLoading: (loading: boolean) => void;
  fetchToken: () => Promise<void>;
  fetchData: () => Promise<void>;
  fetchGames: () => Promise<void>;
};

const API_URL = import.meta.env.VITE_API_URL;
const API_AUTH_USERNAME = import.meta.env.VITE_API_AUTH_USERNAME;
const API_AUTH_PASSWORD = import.meta.env.VITE_API_AUTH_PASSWORD;

export const useAppStore = create<AppState>((set, get) => ({
  token: null,
  data: null,
  games: null,
  loading: false,

  setToken: (token) => set({ token }),
  setData: (data) => set({ data }),
  setGames: (games) => set({ games }),
  setLoading: (loading) => set({ loading }),

  // Fetch token once
  fetchToken: async () => {
    if (get().token) return; // already have token

    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/api/auth/${API_AUTH_USERNAME}/${API_AUTH_PASSWORD}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
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
}));
