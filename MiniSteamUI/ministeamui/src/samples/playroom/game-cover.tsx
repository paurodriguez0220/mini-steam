import type { JSX } from "react";

/**
 * There are no cover images in the API (iconPath is always ""), so every cover is
 * generated: a flat-vector "sticker" scene per game, drawn on a bold colour block.
 * Scenes are chosen from the title, with a chunky typographic fallback.
 */
export type CoverScene = "tiles" | "snake" | "bomb" | "initials";

export interface GameCoverProps {
  /** Game title - decides which mascot scene is drawn and feeds the fallback initials. */
  title: string;
  /** Stable number (the game id) used to pick a palette for the fallback scene. */
  seed: number;
  /** Optional small pill drawn over the art, e.g. the category. */
  ribbon?: string;
  /** Slightly heavier framing for the hero slot. */
  isHero?: boolean;
}

interface ScenePalette {
  ground: string;
  wash: string;
  accent: string;
}

const INK = "#241c18";
const CREAM = "#fffaf2";

const FALLBACK_PALETTES: ScenePalette[] = [
  { ground: "#e7e0ff", wash: "#cfc2ff", accent: "#6f52f4" },
  { ground: "#ffe0dc", wash: "#ffc3bc", accent: "#e8352e" },
  { ground: "#d9f2e6", wash: "#b6e6d0", accent: "#1faa63" },
];

const SCENE_GROUND: Record<CoverScene, string> = {
  tiles: "#ffeec4",
  snake: "#d7f5e6",
  bomb: "#dcebff",
  initials: "#e7e0ff",
};

export function resolveScene(title: string): CoverScene {
  const key = title.toLowerCase();
  if (key.includes("2048")) return "tiles";
  if (key.includes("snake")) return "snake";
  if (key.includes("mine")) return "bomb";
  return "initials";
}

function initialsFor(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function eyes(cx: number, cy: number, gap: number, size: number): JSX.Element {
  return (
    <g>
      <circle cx={cx - gap} cy={cy} r={size} fill={CREAM} />
      <circle cx={cx + gap} cy={cy} r={size} fill={CREAM} />
      <circle cx={cx - gap + size * 0.18} cy={cy + size * 0.12} r={size * 0.46} fill={INK} />
      <circle cx={cx + gap + size * 0.18} cy={cy + size * 0.12} r={size * 0.46} fill={INK} />
    </g>
  );
}

function sparkle(x: number, y: number, r: number, fill: string): JSX.Element {
  return (
    <path
      d={`M ${x} ${y - r} Q ${x + r * 0.22} ${y - r * 0.22} ${x + r} ${y} Q ${x + r * 0.22} ${
        y + r * 0.22
      } ${x} ${y + r} Q ${x - r * 0.22} ${y + r * 0.22} ${x - r} ${y} Q ${x - r * 0.22} ${
        y - r * 0.22
      } ${x} ${y - r} Z`}
      fill={fill}
    />
  );
}

function tilesScene(): JSX.Element {
  return (
    <g>
      <circle cx={252} cy={62} r={74} fill="#ffd87a" />
      <rect x={18} y={150} width={96} height={96} rx={26} fill="#ffdd92" />
      {sparkle(46, 46, 15, "#f0a91b")}
      {sparkle(286, 186, 12, "#f0a91b")}

      <g className="pr-cover__mascot">
        <g transform="rotate(-11 92 128)">
          <rect x={48} y={84} width={88} height={88} rx={24} fill={CREAM} />
          <text
            x={92}
            y={130}
            fill="#d9911a"
            fontSize={46}
            fontWeight={800}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontFamily: "var(--pr-display)" }}
          >
            2
          </text>
        </g>
        <g transform="rotate(9 168 78)">
          <rect x={130} y={40} width={76} height={76} rx={22} fill="#f0a91b" />
          <text
            x={168}
            y={80}
            fill={CREAM}
            fontSize={40}
            fontWeight={800}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontFamily: "var(--pr-display)" }}
          >
            4
          </text>
        </g>
        <g transform="rotate(-4 196 148)">
          <rect x={140} y={92} width={112} height={112} rx={30} fill="#e8352e" />
          <text
            x={196}
            y={132}
            fill={CREAM}
            fontSize={56}
            fontWeight={800}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontFamily: "var(--pr-display)" }}
          >
            8
          </text>
          {eyes(196, 170, 20, 11)}
        </g>
      </g>
    </g>
  );
}

function snakeScene(): JSX.Element {
  return (
    <g>
      <circle cx={70} cy={62} r={54} fill="#bdecd6" />
      <circle cx={272} cy={214} r={62} fill="#bdecd6" />
      <circle cx={40} cy={196} r={9} fill="#8fdcba" />
      <circle cx={300} cy={54} r={9} fill="#8fdcba" />
      {sparkle(46, 118, 12, "#5fcf9b")}

      <g className="pr-cover__mascot">
        <path
          d="M46 194 H 92 Q 118 194 118 168 V 136 Q 118 110 144 110 H 176"
          fill="none"
          stroke="#1faa63"
          strokeWidth={34}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M46 194 H 92 Q 118 194 118 168 V 136 Q 118 110 144 110 H 176"
          fill="none"
          stroke="#3fc984"
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.55}
        />
        <rect x={168} y={80} width={68} height={62} rx={22} fill="#17a05c" />
        <path d="M236 108 h 16 m -16 6 l 18 8 m -18 -20 l 18 -8" stroke="#e8352e" strokeWidth={5} strokeLinecap="round" fill="none" />
        {eyes(202, 104, 16, 10)}
        <path
          d="M188 126 q 14 12 28 0"
          stroke={INK}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
        />
      </g>

      <g>
        <circle cx={262} cy={188} r={26} fill="#e8352e" />
        <circle cx={254} cy={180} r={7} fill="#ff8a83" />
        <path d="M262 162 q 2 -14 18 -16 q -2 14 -18 16 Z" fill="#1faa63" />
      </g>
    </g>
  );
}

function bombScene(): JSX.Element {
  return (
    <g>
      <g opacity={0.75}>
        <rect x={26} y={128} width={54} height={54} rx={16} fill="#c2dcff" />
        <rect x={26} y={188} width={54} height={54} rx={16} fill="#c2dcff" />
        <rect x={86} y={188} width={54} height={54} rx={16} fill="#c2dcff" />
        <rect x={240} y={128} width={54} height={54} rx={16} fill="#c2dcff" />
        <rect x={240} y={188} width={54} height={54} rx={16} fill="#c2dcff" />
      </g>
      <circle cx={62} cy={54} r={34} fill="#c2dcff" />

      <g className="pr-cover__mascot">
        <g stroke="#2b2440" strokeWidth={13} strokeLinecap="round">
          <line x1={158} y1={70} x2={158} y2={44} />
          <line x1={158} y1={218} x2={158} y2={244} />
          <line x1={96} y1={144} x2={70} y2={144} />
          <line x1={220} y1={144} x2={246} y2={144} />
          <line x1={116} y1={102} x2={98} y2={84} />
          <line x1={200} y1={186} x2={218} y2={204} />
        </g>
        <circle cx={158} cy={144} r={64} fill="#2b2440" />
        <ellipse cx={134} cy={118} rx={18} ry={12} fill={CREAM} opacity={0.22} transform="rotate(-32 134 118)" />
        {eyes(158, 136, 22, 13)}
        <path
          d="M142 172 q 16 14 32 0"
          stroke={CREAM}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
          opacity={0.8}
        />
        <path
          d="M196 96 q 26 -18 22 -46"
          stroke="#8a6a4a"
          strokeWidth={9}
          strokeLinecap="round"
          fill="none"
        />
        {sparkle(220, 44, 22, "#f0a91b")}
        {sparkle(220, 44, 11, "#fff2cc")}
      </g>

      <g>
        <rect x={268} y={40} width={7} height={54} rx={3} fill="#2b2440" />
        <path d="M268 42 h 34 l -12 15 l 12 15 h -34 Z" fill="#e8352e" />
      </g>
    </g>
  );
}

function initialsScene(text: string, palette: ScenePalette): JSX.Element {
  return (
    <g>
      <circle cx={278} cy={54} r={58} fill={palette.wash} />
      <circle cx={40} cy={206} r={44} fill={palette.wash} />
      {sparkle(52, 52, 15, palette.accent)}
      {sparkle(280, 200, 12, palette.accent)}

      <g className="pr-cover__mascot">
        <g transform="rotate(-6 160 122)">
          <rect x={72} y={44} width={176} height={156} rx={40} fill={palette.accent} />
          <text
            x={160}
            y={112}
            fill={CREAM}
            fontSize={72}
            fontWeight={800}
            letterSpacing="-2"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontFamily: "var(--pr-display)" }}
          >
            {text}
          </text>
          {eyes(160, 162, 22, 12)}
        </g>
      </g>
    </g>
  );
}

export function GameCover({ title, seed, ribbon, isHero = false }: GameCoverProps): JSX.Element {
  const scene = resolveScene(title);
  const palette = FALLBACK_PALETTES[Math.abs(seed) % FALLBACK_PALETTES.length];
  const ground = scene === "initials" ? palette.ground : SCENE_GROUND[scene];

  return (
    <div
      className={isHero ? "pr-cover pr-cover--hero" : "pr-cover"}
      style={{ background: ground }}
    >
      <svg
        className="pr-cover__svg"
        viewBox="0 0 320 240"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={`${title} cover artwork`}
        focusable="false"
      >
        <rect x={0} y={0} width={320} height={240} fill={ground} />
        {scene === "tiles" ? tilesScene() : null}
        {scene === "snake" ? snakeScene() : null}
        {scene === "bomb" ? bombScene() : null}
        {scene === "initials" ? initialsScene(initialsFor(title), palette) : null}
      </svg>
      <span className="pr-cover__shine" aria-hidden="true" />
      {ribbon ? <span className="pr-cover__ribbon">{ribbon}</span> : null}
    </div>
  );
}
