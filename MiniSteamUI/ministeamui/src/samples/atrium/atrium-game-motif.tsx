import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { motifKindFor, plateCaptionFor, type AtriumMotifKind } from "./atrium-data";

export interface AtriumGameMotifProps {
  /** The game whose mechanics the motif is derived from. */
  game: Game;
  /** `hero` uses a taller, calmer crop for the featured and detail panels. */
  variant?: "card" | "hero";
}

/**
 * Stands in for cover art. The API returns an empty `iconPath`, so instead of a
 * placeholder box each title gets a hairline geometric mark drawn from its own
 * board: a 4x4 tile grid, a coiled path, a minefield lattice.
 */
export function AtriumGameMotif({
  game,
  variant = "card",
}: AtriumGameMotifProps): JSX.Element {
  const kind = motifKindFor(game);

  return (
    <div
      className={`at-motif${variant === "hero" ? " at-motif--tall" : ""}`}
      data-motif={kind}
      aria-hidden="true"
    >
      <svg
        className="at-motif__svg"
        viewBox="0 0 160 120"
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
        focusable="false"
      >
        {renderMotif(kind)}
      </svg>
      <p className="at-motif__glyph">{plateCaptionFor(game)}</p>
    </div>
  );
}

function renderMotif(kind: AtriumMotifKind): JSX.Element {
  if (kind === "grid") return <TileGrid />;
  if (kind === "coil") return <CoiledPath />;
  if (kind === "lattice") return <MinefieldLattice />;
  return <ConcentricArcs />;
}

/* -------------------------------------------------------------------------- */
/* 2048 - a 4x4 board with three tiles resolved                                */
/* -------------------------------------------------------------------------- */

const TILE_WEIGHTS: Record<string, "soft" | "strong"> = {
  "3-0": "soft",
  "0-2": "soft",
  "2-3": "strong",
  "3-3": "soft",
};

function TileGrid(): JSX.Element {
  const cells: JSX.Element[] = [];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const x = 32 + col * 24;
      const y = 12 + row * 24;
      const weight = TILE_WEIGHTS[`${col}-${row}`];
      cells.push(
        <rect
          key={`c${col}-${row}`}
          className={
            weight
              ? `at-motif__fill${weight === "strong" ? " at-motif__fill--strong" : ""}`
              : "at-motif__line at-motif__line--faint"
          }
          x={x + 2}
          y={y + 2}
          width={20}
          height={20}
          rx={3}
        />,
      );
    }
  }

  return (
    <g>
      <rect
        className="at-motif__line at-motif__line--faint"
        x={28}
        y={8}
        width={104}
        height={104}
        rx={8}
      />
      {cells}
      <rect
        className="at-motif__line"
        x={34}
        y={38}
        width={44}
        height={20}
        rx={3}
      />
      <path className="at-motif__line at-motif__line--bold" d="M84 48 H104" />
      <path className="at-motif__line at-motif__line--bold" d="M99 43 L104 48 L99 53" />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* Snake - one continuous inward coil                                          */
/* -------------------------------------------------------------------------- */

const COIL =
  "M32 12 H128 V108 H44 V24 H116 V96 H56 V36 H104 V84 H68 V48 H92 V72 H80";

function CoiledPath(): JSX.Element {
  return (
    <g>
      <path className="at-motif__line at-motif__line--bold" d={COIL} />
      <circle className="at-motif__dot" cx={80} cy={72} r={3.4} />
      <circle className="at-motif__line" cx={32} cy={12} r={2.6} />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* Minesweeper - a lattice with three charges                                   */
/* -------------------------------------------------------------------------- */

const MINES: ReadonlyArray<readonly [number, number]> = [
  [56, 36],
  [104, 68],
  [72, 100],
];

const SPOKES: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [0.7, -0.7],
  [1, 0],
  [0.7, 0.7],
  [0, 1],
  [-0.7, 0.7],
  [-1, 0],
  [-0.7, -0.7],
];

function MinefieldLattice(): JSX.Element {
  const lines: JSX.Element[] = [];
  for (let i = 0; i <= 6; i += 1) {
    lines.push(
      <path
        key={`v${i}`}
        className="at-motif__line at-motif__line--faint"
        d={`M${32 + i * 16} 12 V108`}
      />,
    );
    lines.push(
      <path
        key={`h${i}`}
        className="at-motif__line at-motif__line--faint"
        d={`M32 ${12 + i * 16} H128`}
      />,
    );
  }

  return (
    <g>
      {lines}
      <rect
        className="at-motif__fill at-motif__fill--strong"
        x={80}
        y={44}
        width={16}
        height={16}
      />
      <rect
        className="at-motif__fill"
        x={32}
        y={76}
        width={16}
        height={16}
      />
      {MINES.map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          {SPOKES.map(([dx, dy], index) => (
            <path
              key={index}
              className="at-motif__line"
              d={`M${cx + dx * 4} ${cy + dy * 4} L${cx + dx * 7.5} ${cy + dy * 7.5}`}
            />
          ))}
          <circle className="at-motif__dot" cx={cx} cy={cy} r={3} />
        </g>
      ))}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* Fallback - quiet concentric arcs                                            */
/* -------------------------------------------------------------------------- */

function ConcentricArcs(): JSX.Element {
  return (
    <g>
      {[20, 34, 48, 62].map((r, index) => (
        <circle
          key={r}
          className={
            index === 1
              ? "at-motif__line at-motif__line--bold"
              : "at-motif__line at-motif__line--faint"
          }
          cx={80}
          cy={60}
          r={r}
        />
      ))}
      <circle className="at-motif__dot" cx={80} cy={60} r={3} />
    </g>
  );
}
