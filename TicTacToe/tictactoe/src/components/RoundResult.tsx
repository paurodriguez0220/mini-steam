import type { JSX } from "react";
import type { RoundOutcome } from "../types";
import { MAX_MATCH_SCORE, POINTS_FOR_DRAW, POINTS_FOR_WIN } from "../utils/config";

export interface RoundResultProps {
  outcome: RoundOutcome;
  /** True on the last round, when this is the match result rather than a round one. */
  matchOver: boolean;
  score: number;
}

const ROUND_COPY: Record<RoundOutcome, { title: string; tone: string }> = {
  won: { title: "You win", tone: "text-mint" },
  lost: { title: "You lose", tone: "text-primary" },
  drawn: { title: "Draw", tone: "text-ink" },
};

function pointsFor(outcome: RoundOutcome): number {
  if (outcome === "won") return POINTS_FOR_WIN;
  if (outcome === "drawn") return POINTS_FOR_DRAW;
  return 0;
}

/**
 * The overlay between rounds, and at the end of the match.
 *
 * It states the points the round earned, because a drawn round scoring
 * anything at all is the one rule a player will not guess - and on hard it is
 * the only way to score.
 */
export function RoundResult({ outcome, matchOver, score }: RoundResultProps): JSX.Element {
  const { title, tone } = ROUND_COPY[outcome];
  const points = pointsFor(outcome);

  return (
    <div className="absolute inset-x-2 top-1/2 flex -translate-y-1/2 justify-center">
      <div
        role="status"
        className="flex animate-pop-in flex-col items-center gap-1 rounded-lg bg-surface/95 px-6 py-4 text-center shadow-soft-2"
      >
        <span className={`font-display text-2xl ${tone}`}>
          {matchOver ? "Match over" : title}
        </span>

        {matchOver ? (
          <span className="font-text text-sm text-ink-soft">
            Final score{" "}
            <span className="font-display text-ink">
              {score}/{MAX_MATCH_SCORE}
            </span>
          </span>
        ) : (
          <span className="font-text text-sm text-ink-soft">
            {points === 1 ? "+1 point" : `+${points} points`}
          </span>
        )}
      </div>
    </div>
  );
}
