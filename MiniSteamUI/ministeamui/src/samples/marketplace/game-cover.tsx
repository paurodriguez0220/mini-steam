import type { CSSProperties, JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { CoverMotif } from "./cover-motif";
import { categoryKind, catalogueId, coverHue, monogram, titleScale } from "./art";

export type CoverVariant = "lg" | "md" | "sm";

export interface GameCoverProps {
  game: Game;
  /** lg = hero / detail stage, md = catalogue card, sm = 34px library chip. */
  variant?: CoverVariant;
}

/** CSS custom properties are not part of CSSProperties, so widen the type. */
type CoverStyle = CSSProperties & Record<"--ms-h", string>;

/**
 * Generated cover plate. The API returns an empty `iconPath`, so the artwork is
 * built entirely from the game's own fields: a hue derived from its category,
 * a hairline grid, a category motif and the title set as the image itself.
 */
export function GameCover({ game, variant = "md" }: GameCoverProps): JSX.Element {
  const hue = coverHue(game);
  const kind = categoryKind(game.category);
  const style: CoverStyle = { "--ms-h": String(hue) };

  if (variant === "sm") {
    return (
      <span className="ms-cover ms-cover--sm" style={style} aria-hidden="true">
        <span className="ms-cover__glow" />
        <span className="ms-cover__mono">{monogram(game.title)}</span>
        <span className="ms-cover__scan" />
      </span>
    );
  }

  return (
    <div
      className={`ms-cover ms-cover--${variant} ms-cover--t-${titleScale(game.title)}`}
      style={style}
      aria-hidden="true"
    >
      <div className="ms-cover__grid" />
      <div className="ms-cover__glow" />
      <CoverMotif kind={kind} className="ms-cover__motif" />
      <div className="ms-cover__vignette" />
      <div className="ms-cover__type">
        <div className="ms-cover__kicker">
          {catalogueId(game.id)} / {game.category}
        </div>
        <div className="ms-cover__rule" />
        <p className="ms-cover__title">{game.title}</p>
      </div>
      <div className="ms-cover__scan" />
    </div>
  );
}
