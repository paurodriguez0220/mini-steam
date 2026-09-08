import type { JSX } from "react";

export type NoticeTone = "empty" | "error";

export interface NoticePanelProps {
  tone: NoticeTone;
  title: string;
  message: string;
  /** Optional recovery action, e.g. "Clear search". */
  actionLabel?: string;
  onAction?: () => void;
}

function emptyArt(): JSX.Element {
  return (
    <svg viewBox="0 0 120 120" className="pr-note__art" role="img" aria-label="A magnifying glass finding nothing">
      <circle cx={60} cy={58} r={44} fill="var(--pr-butter-soft)" />
      <circle cx={54} cy={52} r={26} fill="none" stroke="var(--pr-ink)" strokeWidth={7} opacity={0.85} />
      <line x1={73} y1={71} x2={92} y2={90} stroke="var(--pr-ink)" strokeWidth={9} strokeLinecap="round" opacity={0.85} />
      <circle cx={46} cy={48} r={4.6} fill="var(--pr-ink)" />
      <circle cx={62} cy={48} r={4.6} fill="var(--pr-ink)" />
      <path d="M46 62 q 8 -7 16 0" stroke="var(--pr-ink)" strokeWidth={4.5} strokeLinecap="round" fill="none" />
    </svg>
  );
}

function errorArt(): JSX.Element {
  return (
    <svg viewBox="0 0 120 120" className="pr-note__art" role="img" aria-label="An unplugged cable">
      <circle cx={60} cy={60} r={44} fill="var(--pr-primary-soft)" />
      <rect x={20} y={50} width={34} height={22} rx={9} fill="var(--pr-ink)" opacity={0.85} />
      <rect x={66} y={50} width={34} height={22} rx={9} fill="var(--pr-primary)" />
      <path d="M54 61 h 8" stroke="var(--pr-ink)" strokeWidth={5} strokeLinecap="round" opacity={0.35} />
      <path d="M60 34 l 6 10 M74 38 l -4 9 M46 38 l 4 9" stroke="var(--pr-ink)" strokeWidth={5} strokeLinecap="round" opacity={0.6} />
    </svg>
  );
}

export function NoticePanel({ tone, title, message, actionLabel, onAction }: NoticePanelProps): JSX.Element {
  return (
    <div className="pr-note" role={tone === "error" ? "alert" : "status"}>
      {tone === "error" ? errorArt() : emptyArt()}
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && onAction ? (
        <button type="button" className="pr-btn pr-btn--primary" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
