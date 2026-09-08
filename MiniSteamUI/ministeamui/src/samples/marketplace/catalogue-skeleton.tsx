import type { JSX } from "react";

export interface CatalogueSkeletonProps {
  /** Number of placeholder tiles under the featured slot. */
  count?: number;
}

const LINE_WIDTHS = ["62%", "94%", "88%", "48%"];

/** Loading state: mirrors the real hero + grid rhythm so nothing jumps. */
export function CatalogueSkeleton({ count = 6 }: CatalogueSkeletonProps): JSX.Element {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="ms-mono">Fetching catalogue</span>

      <section className="ms-hero" style={{ marginTop: 12 }}>
        <div className="ms-hero__art ms-skel__block" />
        <div className="ms-hero__panel">
          {LINE_WIDTHS.map((width) => (
            <div key={width} className="ms-skel__line" style={{ width }} />
          ))}
          <div className="ms-skel__line" style={{ width: "40%", height: 30 }} />
        </div>
      </section>

      <div className="ms-sect-head">
        <div className="ms-skel__line" style={{ width: 160, height: 12 }} />
      </div>

      <div className="ms-grid">
        {Array.from({ length: count }, (_, index) => (
          <article className="ms-skel" key={index}>
            <div className="ms-card__art ms-skel__block" />
            <div className="ms-card__body">
              <div className="ms-skel__line" style={{ width: "70%" }} />
              <div className="ms-skel__line" style={{ width: "35%" }} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
