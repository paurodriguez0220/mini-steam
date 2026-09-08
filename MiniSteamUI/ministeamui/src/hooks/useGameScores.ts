import { useEffect } from "react";
import { isGameScoreMessage } from "../../../../shared/game-score";
import type { GameScoreMessage } from "../../../../shared/game-score";
import { useAppStore } from "../store/useAppStore";

/**
 * Listens for score messages posted up by an embedded game.
 *
 * A game is served from its own origin, so anything framed or opened could
 * post here. Two gates before a message is trusted:
 *
 *  1. `event.origin` must be one of the game origins we actually serve. The
 *     list is derived from the games the API gave us, so it needs no separate
 *     configuration and cannot drift from the iframe sources.
 *  2. The payload must match the shape in `shared/game-score.ts`.
 *
 * A `final` message is recorded through the API; `ready` and `progress` only
 * drive the live HUD and are never persisted.
 */
export function useGameScores(): void {
  const games = useAppStore((state) => state.games);
  const setLiveMetric = useAppStore((state) => state.setLiveMetric);
  const submitScore = useAppStore((state) => state.submitScore);

  useEffect(() => {
    if (!games || games.length === 0) return;

    const allowedOrigins = new Set<string>();
    for (const game of games) {
      try {
        allowedOrigins.add(new URL(game.url).origin);
      } catch {
        // A malformed url in the catalogue should not disable the listener.
      }
    }

    const onMessage = (event: MessageEvent): void => {
      if (!allowedOrigins.has(event.origin)) return;
      if (!isGameScoreMessage(event.data)) return;

      const message: GameScoreMessage = event.data;

      if (message.type === "final") {
        setLiveMetric(null);
        void submitScore(message);
        return;
      }

      setLiveMetric(message.metric);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [games, setLiveMetric, submitScore]);
}
