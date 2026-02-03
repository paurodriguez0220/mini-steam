import { create } from "zustand";
import { useEnv } from "../hooks/useEnv";


type AppState = {
  token: string | null;
  data: any | null;
  loading: boolean;
  setToken: (token: string) => void;
  setData: (data: any) => void;
  setLoading: (loading: boolean) => void;
  fetchToken: () => Promise<void>;
  fetchData: () => Promise<void>;
};

const { API_URL, API_AUTH_USERNAME, API_AUTH_PASSWORD } = useEnv();

export const useAppStore = create<AppState>((set, get) => ({
  token: null,
  data: null,
  loading: false,

  setToken: (token) => set({ token }),
  setData: (data) => set({ data }),
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
}));
