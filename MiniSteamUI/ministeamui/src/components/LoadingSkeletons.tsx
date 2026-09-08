import type { JSX } from "react";

export interface LoadingSkeletonsProps {
  /**
   * How many card placeholders to draw. `0` renders the grid on its own - the
   * detail route has no hero, so a hero placeholder there would be a lie.
   */
  cardCount?: number;
}

/**
 * `skel` (shared theme) carries the shimmer and a 22px radius, so the radius
 * overrides below are marked important - they have to beat that utility whatever
 * order the two land in.
 */
const LINE = "skel h-3.5";
const BUTTON = "skel h-11 rounded-full!";
const COVER = "skel aspect-4/3 rounded-lg!";

/** Same shelf grid as the catalogue: one column on phones, auto-fill above. */
const GRID =
  "grid grid-cols-1 gap-4 " +
  "sm:grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] sm:gap-[18px] " +
  "lg:grid-cols-[repeat(auto-fill,minmax(min(100%,262px),1fr))] lg:gap-[22px]";

export function LoadingSkeletons({ cardCount = 3 }: LoadingSkeletonsProps): JSX.Element {
  return (
    <div className="flex flex-col gap-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the games shelf</span>

      {cardCount === 0 ? null : (
        <div className="grid grid-cols-1 items-center gap-5 rounded-lg border-2 border-line bg-surface p-4 shadow-soft-2 sm:gap-6 sm:rounded-xl sm:p-[26px] min-[881px]:grid-cols-[1.05fr_0.95fr] lg:gap-[34px] lg:p-[38px]">
          <div className="flex flex-col gap-3.5">
            <span className={LINE} style={{ width: "34%", height: 22 }} />
            <span className={LINE} style={{ width: "78%", height: 52 }} />
            <span className={LINE} style={{ width: "94%" }} />
            <span className={LINE} style={{ width: "66%" }} />
            <span className={BUTTON} style={{ width: 190, marginTop: 8 }} />
          </div>
          <span className={COVER} />
        </div>
      )}

      <div className={GRID}>
        {Array.from({ length: cardCount }, (_, index) => (
          <div
            className="flex flex-col gap-3 rounded-lg border-2 border-line bg-surface p-3"
            key={index}
          >
            <span className={COVER} />
            <span className={LINE} style={{ width: "62%", height: 20 }} />
            <span className={LINE} style={{ width: "42%" }} />
            <span className={BUTTON} />
          </div>
        ))}
      </div>
    </div>
  );
}
