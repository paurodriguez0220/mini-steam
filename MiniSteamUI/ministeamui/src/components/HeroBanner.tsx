import type { JSX } from "react";
import type { Game } from "../store/useAppStore";
import { GameCover } from "./GameCover";
import { Button } from "./Button";
import { PlayIcon } from "./icons";

export interface HeroBannerProps {
  /** The featured game. */
  game: Game;
  onPlay: (game: Game) => void;
  onOpen: (game: Game) => void;
}

/**
 * `group` drives both the cover mascot lift and the art straightening on hover.
 * The two blobs are pseudo-elements so they stay out of the accessibility tree.
 */
const HERO =
  "group relative grid grid-cols-1 items-center overflow-hidden rounded-lg border-2 border-line " +
  "bg-surface p-4 gap-5 shadow-soft-3 scroll-mt-24 " +
  "sm:gap-6 sm:rounded-xl sm:p-[26px] " +
  "min-[881px]:grid-cols-[1.05fr_0.95fr] " +
  "lg:gap-[34px] lg:p-[38px] " +
  // top-right organic blob
  'before:absolute before:content-[""] before:z-0 before:h-[460px] before:w-[460px] ' +
  "before:top-[-180px] before:right-[-150px] before:bg-primary-soft " +
  "before:[border-radius:46%_54%_58%_42%/50%_44%_56%_50%] " +
  "sm:before:top-[-140px] sm:before:right-[-120px] " +
  // bottom-left circle
  'after:absolute after:content-[""] after:z-0 after:h-[260px] after:w-[260px] ' +
  "after:bottom-[-130px] after:left-[-90px] after:rounded-full after:bg-butter-soft";

/**
 * Above the copy and flat while stacked; to the right, tilted, and straightening
 * on hover once the two columns fit side by side.
 */
const ART =
  "relative z-[1] order-first mx-auto w-full max-w-[460px] " +
  "transition-transform duration-500 ease-spring group-hover:scale-[1.02] " +
  "min-[881px]:order-none min-[881px]:mx-0 min-[881px]:max-w-none " +
  "min-[881px]:rotate-2 min-[881px]:group-hover:rotate-0";

const TAG =
  "inline-flex items-center gap-[7px] rounded-full border-2 border-line bg-surface-2 " +
  "px-3.5 py-[7px] text-[13px] font-extrabold text-ink-soft";

/** Full-width stacked buttons on phones, side by side from 640px up. */
const HERO_BUTTON = "flex-[1_1_100%] sm:flex-[0_1_auto]";

export function HeroBanner({ game, onPlay, onOpen }: HeroBannerProps): JSX.Element {
  return (
    <section className={HERO} aria-labelledby="hero-title">
      <div className="relative z-[1] flex flex-col items-start gap-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-[7px] text-[12px] font-black tracking-[0.16em] uppercase text-primary-deep dark:text-primary">
          Playing today
        </span>
        <h1 className="text-[clamp(38px,7.5vw,66px)]" id="hero-title">
          {game.title}
        </h1>
        <p className="max-w-[46ch] text-[17px] font-semibold text-ink-soft">{game.description}</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={TAG}>{game.category}</span>
          <span className={TAG}>Runs in your browser</span>
          <span className={TAG}>Nothing to install</span>
        </div>
        <div className="flex w-full flex-wrap gap-3 pt-1 sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            className={HERO_BUTTON}
            onClick={() => onPlay(game)}
          >
            <PlayIcon size={20} />
            Play now
          </Button>
          <Button variant="ghost" size="lg" className={HERO_BUTTON} onClick={() => onOpen(game)}>
            More about it
          </Button>
        </div>
      </div>

      <div className={ART}>
        <GameCover title={game.title} seed={game.id} ribbon={game.category} isHero />
      </div>
    </section>
  );
}
