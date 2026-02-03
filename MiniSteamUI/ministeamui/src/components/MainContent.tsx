import React from "react";
import Hero from "./Hero";
import GameCard from "./GameCard";

const MainContent: React.FC = () => {
  return (
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 text-gray-900 dark:text-gray-100">
        <Hero />
        <section>
            <h2 className="text-lg font-semibold mb-4">Based on Your Library</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <GameCard title="Subnautica" price="$29.99" />
                <GameCard title="The Last of Us Part I" price="$56.99" discount="5%" />
                <GameCard title="Twelve Minutes" price="$24.99" />
                <GameCard title="Batman Arkham Origins" price="$19.99" />
            </div>
        </section>
        </main>
  );
};

export default MainContent;
