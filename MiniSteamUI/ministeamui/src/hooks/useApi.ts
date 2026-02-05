import { useAppStore } from "../store/useAppStore";
import { useCallback } from "react";

export const useApi = () => {
  // Wrap in useCallback for stable reference
  const initApi = useCallback(async () => {
    const { fetchToken, fetchGames } = useAppStore.getState();
    await fetchToken(); // Wait for token first
    
    // Only fetch games if token was successful
    const token = useAppStore.getState().token;
    if (token) {
      await fetchGames();
    }
  }, []); // Empty deps because we access getState directly

  return { initApi }; // ✅ must return an object with initApi
};
