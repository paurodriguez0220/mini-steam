import type { JSX } from "react";

export interface SpecRow {
  key: string;
  value: string;
}

export interface SpecListProps {
  rows: SpecRow[];
}

/** Hairline key/value table used by the hero panel and the detail sidebar. */
export function SpecList({ rows }: SpecListProps): JSX.Element {
  return (
    <dl className="ms-spec">
      {rows.map((row) => (
        <div className="ms-spec__row" key={row.key}>
          <dt className="ms-spec__key">{row.key}</dt>
          <dd className="ms-spec__val">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
