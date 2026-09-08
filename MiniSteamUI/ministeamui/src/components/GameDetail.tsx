import type { JSX } from "react";
import type { Game } from "../store/useAppStore";
import { GameCover } from "./GameCover";
import { GameCard } from "./GameCard";
import { Button } from "./Button";
import { BackIcon, PlayIcon } from "./icons";

export interface GameDetailProps {
  game: Game;
  /** Everything else in the catalogue, shown as a "more to play" shelf. */
  related: Game[];
  onBack: () => void;
  onPlay: (game: Game) => void;
  onOpen: (game: Game) => void;
}

const PANEL =
  "grid grid-cols-1 items-center gap-[26px] rounded-lg border-2 border-line bg-surface p-4 shadow-soft-2 " +
  "sm:rounded-xl sm:p-[26px] " +
  "min-[881px]:grid-cols-[0.95fr_1.05fr] " +
  "lg:gap-[34px] lg:p-[34px]";

/** Same shelf grid as the catalogue: one column on phones, auto-fill above. */
const GRID =
  "grid grid-cols-1 gap-4 " +
  "sm:grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] sm:gap-[18px] " +
  "lg:grid-cols-[repeat(auto-fill,minmax(min(100%,262px),1fr))] lg:gap-[22px]";

const FACT = "rounded-md border-2 border-line bg-surface-2 px-3.5 py-3";
const FACT_TERM = "text-[11px] font-black tracking-[0.14em] uppercase text-ink-soft";
const FACT_VALUE = "mx-0 mb-0 mt-[2px] font-display text-[17px] font-extrabold";

export function GameDetail({ game, related, onBack, onPlay, onOpen }: GameDetailProps): JSX.Element {
  return (
    <div className="flex flex-col gap-6 animate-pop-in">
      <Button variant="ghost" className="self-start" onClick={onBack}>
        <BackIcon />
        Back to the store
      </Button>

      <section className={PANEL} aria-labelledby="detail-title">
        <div className="mx-auto w-full max-w-[460px] min-[881px]:mx-0 min-[881px]:max-w-none">
          <GameCover title={game.title} seed={game.id} ribbon={game.category} isHero />
        </div>

        <div className="flex flex-col items-start gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-[7px] text-[12px] font-black tracking-[0.16em] uppercase text-primary-deep dark:text-primary">
            {game.category}
          </span>
          <h2 className="text-[clamp(32px,6vw,52px)]" id="detail-title">
            {game.title}
          </h2>
          <p className="max-w-[52ch] text-[17px] font-semibold text-ink-soft">{game.description}</p>

          <dl className="m-0 grid w-full grid-cols-[repeat(auto-fit,minmax(126px,1fr))] gap-2.5">
            <div className={FACT}>
              <dt className={FACT_TERM}>Category</dt>
              <dd className={FACT_VALUE}>{game.category}</dd>
            </div>
            <div className={FACT}>
              <dt className={FACT_TERM}>Players</dt>
              <dd className={FACT_VALUE}>1</dd>
            </div>
            <div className={FACT}>
              <dt className={FACT_TERM}>Controls</dt>
              <dd className={FACT_VALUE}>Keys / touch</dd>
            </div>
            <div className={FACT}>
              <dt className={FACT_TERM}>Price</dt>
              <dd className={FACT_VALUE}>Free</dd>
            </div>
          </dl>

          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => onPlay(game)}
          >
            <PlayIcon size={20} />
            Play {game.title}
          </Button>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="flex flex-col gap-[18px] scroll-mt-24" aria-labelledby="detail-related-title">
          <div className="flex flex-wrap items-end justify-between gap-3.5">
            <div className="flex flex-col items-start gap-2.5">
              <h2 className="text-[clamp(26px,5vw,38px)]" id="detail-related-title">
                More to play
              </h2>
            </div>
          </div>
          <div className={GRID}>
            {related.map((item, index) => (
              <GameCard key={item.id} game={item} index={index} onOpen={onOpen} onPlay={onPlay} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
