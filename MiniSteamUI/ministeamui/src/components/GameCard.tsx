import type { JSX } from "react";
import type { Game } from "../store/useAppStore";
import { GameCover } from "./GameCover";
import { Button } from "./Button";
import { PlayIcon } from "./icons";

export interface GameCardProps {
  game: Game;
  /** Position in the grid - only used to stagger the entrance animation. */
  index?: number;
  onOpen: (game: Game) => void;
  onPlay: (game: Game) => void;
}

/**
 * `group` drives GameCover's mascot lift. The card's own press feedback comes from
 * `:has()` on the overlay button so the two footer buttons don't squash the card.
 */
const CARD =
  "group flex flex-col rounded-lg border-2 border-line bg-surface p-3 shadow-soft-1 animate-pop-in " +
  "transition-[translate,scale,box-shadow,border-color] " +
  "duration-[380ms,380ms,260ms,200ms] " +
  "ease-[var(--ease-spring),var(--ease-spring),var(--ease-soft),var(--ease-soft)] " +
  "hover:-translate-y-2 hover:border-primary hover:shadow-soft-3 " +
  "has-[[data-card-overlay]:active]:-translate-y-[2px] has-[[data-card-overlay]:active]:scale-[0.98]";

/** The footer buttons are narrower and shorter than the default button. */
const FOOT_BUTTON = "flex-1 min-h-11! px-3.5! text-[15px]!";

export function GameCard({ game, index = 0, onOpen, onPlay }: GameCardProps): JSX.Element {
  return (
    <article className={CARD} style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}>
      {/* The cover + title area is one big hit target: an overlay button keeps the
          heading a real heading instead of burying it inside a <button>. */}
      <div className="relative rounded-lg">
        <GameCover title={game.title} seed={game.id} />
        <div className="flex flex-col gap-1 px-2 pt-3.5 pb-2.5">
          <h3 className="text-[21px]">{game.title}</h3>
          <p className="flex items-center gap-2 text-[13px] font-extrabold text-ink-soft">
            <span>{game.category}</span>
            <span aria-hidden="true">&bull;</span>
            <span>Free to play</span>
          </p>
        </div>
        <button
          type="button"
          data-card-overlay=""
          className="absolute inset-0 w-full cursor-pointer rounded-lg border-0 bg-transparent p-0"
          onClick={() => onOpen(game)}
          aria-label={`Open details for ${game.title}`}
        />
      </div>

      <div className="flex gap-2 px-1 pt-0.5 pb-1">
        <Button variant="primary" className={FOOT_BUTTON} onClick={() => onPlay(game)}>
          <PlayIcon size={16} />
          Play
        </Button>
        <Button variant="ghost" className={FOOT_BUTTON} onClick={() => onOpen(game)}>
          Details
        </Button>
      </div>
    </article>
  );
}

export default GameCard;
