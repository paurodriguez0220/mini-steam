import type { JSX } from "react";

export interface ZineColophonProps {
  /** Categories printed in the index column. */
  categories: string[];
}

/** Footer, set as a zine colophon: big sign-off plus print credits. */
export function ZineColophon({ categories }: ZineColophonProps): JSX.Element {
  return (
    <footer className="zine-footer">
      <div className="zine-footer__inner">
        <p className="zine-footer__big">
          Go
          <br />
          play
          <br />
          something
        </p>

        <dl>
          <dt>In this issue</dt>
          <dd>{categories.join(" / ")}</dd>
          <dt>Inks</dt>
          <dd>Flame / Electric / Acid on paper</dd>
          <dt>Set in</dt>
          <dd>Anton &amp; Bricolage Grotesque</dd>
        </dl>

        <dl>
          <dt>Runs on</dt>
          <dd>Any browser, sandboxed iframe</dd>
          <dt>Price</dt>
          <dd>Nothing, forever</dd>
          <dt>Colophon</dt>
          <dd>MiniSteam &mdash; design sample C</dd>
        </dl>
      </div>
    </footer>
  );
}
