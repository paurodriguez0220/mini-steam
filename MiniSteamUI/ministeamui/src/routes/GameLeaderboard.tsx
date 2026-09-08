import { useEffect, useState } from "react";
import type { JSX } from "react";
import { useAppStore, leaderboardKey } from "../store/useAppStore";
import { formatMetric } from "../../../../shared/game-score";

export interface GameLeaderboardProps {
  gameId: number;
  /**
   * Difficulties this game ranks separately. Minesweeper is the only one:
   * a 40-second win on easy and on hard are not the same achievement, so
   * they are never mixed into one board.
   */
  difficulties?: string[];
}

/**
 * Best runs for one game.
 *
 * The board decides its own ordering server-side, so nothing here sorts: it
 * renders `entries` in the order the API returned and only formats the value,
 * which differs by metric (seconds render as `1:07`, points as `13,456`).
 */
export function GameLeaderboard({ gameId, difficulties }: GameLeaderboardProps): JSX.Element {
  const [difficulty, setDifficulty] = useState<string | undefined>(difficulties?.[0]);
  const leaderboards = useAppStore((state) => state.leaderboards);
  const fetchLeaderboard = useAppStore((state) => state.fetchLeaderboard);
  const token = useAppStore((state) => state.token);

  useEffect(() => {
    if (!token) return;
    void fetchLeaderboard(gameId, difficulty);
  }, [token, gameId, difficulty, fetchLeaderboard]);

  const board = leaderboards[leaderboardKey(gameId, difficulty)];
  const entries = board?.entries ?? [];

  return (
    <section
      className="flex flex-col gap-4 rounded-xl border-2 border-line bg-surface p-6 shadow-soft-1"
      aria-labelledby={`leaderboard-${gameId}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-display text-xs font-extrabold tracking-widest text-primary uppercase">
            Best runs
          </span>
          <h3 className="text-xl text-ink" id={`leaderboard-${gameId}`}>
            {board?.betterIs === "lower" ? "Fastest times" : "High scores"}
          </h3>
        </div>

        {difficulties && difficulties.length > 1 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Leaderboard difficulty">
            {difficulties.map((level) => (
              <button
                key={level}
                type="button"
                className="inline-flex min-h-11 items-center rounded-full border-2 border-line bg-surface-2 px-4 font-display text-sm font-extrabold text-ink capitalize transition ease-spring hover:-translate-y-0.5 aria-pressed:border-transparent aria-pressed:bg-ink aria-pressed:text-bg"
                aria-pressed={difficulty === level}
                onClick={() => setDifficulty(level)}
              >
                {level}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <p className="font-text text-sm text-ink-soft">
          No runs recorded yet. Play a round and yours will land here.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={entry.scoreId}
              className="flex items-center gap-4 rounded-md bg-surface-2 px-4 py-3"
            >
              <span className="w-6 shrink-0 font-display text-lg font-extrabold text-primary">
                {entry.rank}
              </span>
              <span className="flex-1 truncate font-text font-semibold text-ink">
                {entry.playerName}
              </span>
              {entry.difficulty ? (
                <span className="rounded-full bg-butter-soft px-3 py-1 font-display text-xs font-extrabold text-ink capitalize">
                  {entry.difficulty}
                </span>
              ) : null}
              <span className="font-display text-lg tabular-nums text-ink">
                {board
                  ? formatMetric({
                      kind: board.metricKind,
                      value: entry.value,
                      betterIs: board.betterIs,
                      label: "",
                    })
                  : entry.value}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default GameLeaderboard;
