import React from "react";
import Hero from "./Hero";
import GameCard from "./GameCard";
import { useAppStore } from "../store/useAppStore";

const MainContent: React.FC = () => {
  const games = useAppStore((state) => state.games);
  const loading = useAppStore((state) => state.loading);

  return (
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 text-gray-900 dark:text-gray-100">
        <Hero />
        <section>
            <h2 className="text-lg font-semibold mb-4">Based on Your Library</h2>
            {loading ? (
              <div className="text-center py-8">Loading games...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {games && games.length > 0 ? (
                  games.map((game) => (
                    <GameCard
                      key={game.id}
                      title={game.title}
                      price="$0.00"
                      imageUrl={game.iconPath}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">No games available</div>
                )}
              </div>
            )}
        </section>
        </main>
  );
};

export default MainContent;
