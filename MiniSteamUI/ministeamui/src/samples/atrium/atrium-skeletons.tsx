import type { JSX } from "react";
import { revealStyle } from "./atrium-reveal";

export interface AtriumHeroSkeletonProps {
  /** Purely decorative; announced once by the parent live region. */
  label?: string;
}

/** Placeholder for the featured panel while the store is loading. */
export function AtriumHeroSkeleton({ label = "Loading" }: AtriumHeroSkeletonProps): JSX.Element {
  return (
    <section className="at-hero" aria-label={label} aria-busy="true">
      <div className="at-shell at-hero__grid">
        <div className="at-hero__text">
          <div className="at-skel at-skel--line" style={{ ...revealStyle(0), width: "8rem" }} />
          <div className="at-skel at-skel--title" style={revealStyle(1)} />
          <div className="at-skel at-skel--line" style={{ ...revealStyle(2), maxWidth: "34rem" }} />
          <div className="at-skel at-skel--line" style={{ ...revealStyle(3), maxWidth: "26rem" }} />
          <div className="at-skel at-skel--pill" style={revealStyle(4)} />
        </div>
        <div className="at-hero__art">
          <div className="at-skel at-skel--art at-skel--art-tall" style={revealStyle(2)} />
        </div>
      </div>
    </section>
  );
}

export interface AtriumCardSkeletonProps {
  /** Stagger position so the pulses do not beat in unison. */
  index: number;
}

/** Placeholder for one catalogue entry. */
export function AtriumCardSkeleton({ index }: AtriumCardSkeletonProps): JSX.Element {
  return (
    <div aria-hidden="true">
      <div className="at-skel at-skel--art" style={revealStyle(index)} />
      <div className="at-skel__body">
        <div className="at-skel at-skel--line" style={{ ...revealStyle(index), width: "5rem" }} />
        <div className="at-skel at-skel--line" style={{ ...revealStyle(index + 1), maxWidth: "12rem", height: "1.4rem" }} />
      </div>
    </div>
  );
}
