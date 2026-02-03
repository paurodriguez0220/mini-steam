import { useEffect } from "react";
import { useTheme } from "./hooks/useTheme";
import { useApi } from "./hooks/useApi";
import { useAppStore } from "./store/useAppStore";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import MainContent from "./components/MainContent";

function App() {
  const { theme, toggleTheme } = useTheme();
  const { initApi } = useApi(); // initialize API on mount

  const loading = useAppStore((state) => state.loading);

  // Run API initialization once
  useEffect(() => {
    initApi();
  }, [initApi]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {loading ? (
          <p className="text-gray-500 dark:text-gray-300">Loading...</p>
        ) : (
          <>
            <Header theme={theme} toggleTheme={toggleTheme} />
            <MainContent />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
