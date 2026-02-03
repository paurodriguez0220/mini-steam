import { useAppStore } from "../store/useAppStore";
import { useCallback } from "react";

export const useApi = () => {
  const fetchToken = useAppStore((state) => state.fetchToken);
  const fetchData = useAppStore((state) => state.fetchData);

  // Wrap in useCallback for stable reference
  const initApi = useCallback(async () => {
    await fetchToken();
    await fetchData();
  }, [fetchToken, fetchData]);

  return { initApi }; // ✅ must return an object with initApi
};
