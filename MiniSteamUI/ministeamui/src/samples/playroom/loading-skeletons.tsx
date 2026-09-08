import type { JSX } from "react";

export interface LoadingSkeletonsProps {
  /** How many card placeholders to draw under the hero placeholder. */
  cardCount?: number;
}

export function LoadingSkeletons({ cardCount = 3 }: LoadingSkeletonsProps): JSX.Element {
  return (
    <div className="pr-main-stack" aria-busy="true" aria-live="polite">
      <span className="pr-sr">Loading the games shelf</span>

      <div className="pr-skel-hero">
        <div className="pr-skel-hero__copy">
          <span className="pr-skel pr-skel--line" style={{ width: "34%", height: 22 }} />
          <span className="pr-skel pr-skel--line" style={{ width: "78%", height: 52 }} />
          <span className="pr-skel pr-skel--line" style={{ width: "94%" }} />
          <span className="pr-skel pr-skel--line" style={{ width: "66%" }} />
          <span className="pr-skel pr-skel--btn" style={{ width: 190, marginTop: 8 }} />
        </div>
        <span className="pr-skel pr-skel--cover" />
      </div>

      <div className="pr-grid">
        {Array.from({ length: cardCount }, (_, index) => (
          <div className="pr-skel-card" key={index}>
            <span className="pr-skel pr-skel--cover" />
            <span className="pr-skel pr-skel--line" style={{ width: "62%", height: 20 }} />
            <span className="pr-skel pr-skel--line" style={{ width: "42%" }} />
            <span className="pr-skel pr-skel--btn" />
          </div>
        ))}
      </div>
    </div>
  );
}
