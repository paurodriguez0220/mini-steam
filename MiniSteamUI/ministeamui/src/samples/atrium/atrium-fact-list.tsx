import type { JSX } from "react";
import type { AtriumFacts } from "./atrium-data";

export interface AtriumFactListProps {
  facts: AtriumFacts;
}

/** Hairline-ruled metadata row used by the featured panel and the detail view. */
export function AtriumFactList({ facts }: AtriumFactListProps): JSX.Element {
  const entries: ReadonlyArray<readonly [string, string]> = [
    ["Category", facts.category],
    ["Controls", facts.controls],
    ["Session", facts.session],
    ["Format", facts.format],
  ];

  return (
    <ul className="at-facts">
      {entries.map(([key, value]) => (
        <li key={key}>
          <span className="at-fact__key">{key}</span>
          <span className="at-fact__val">{value}</span>
        </li>
      ))}
    </ul>
  );
}
