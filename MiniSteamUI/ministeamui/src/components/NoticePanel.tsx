import type { JSX } from "react";
import { Button } from "./Button";

export type NoticeTone = "empty" | "error";

export interface NoticePanelProps {
  tone: NoticeTone;
  title: string;
  message: string;
  /** Optional recovery action, e.g. "Clear search". */
  actionLabel?: string;
  onAction?: () => void;
}

const ART = "h-[120px] w-[120px]";

function emptyArt(): JSX.Element {
  return (
    <svg viewBox="0 0 120 120" className={ART} role="img" aria-label="A magnifying glass finding nothing">
      <circle cx={60} cy={58} r={44} fill="var(--color-butter-soft)" />
      <circle cx={54} cy={52} r={26} fill="none" stroke="var(--color-ink)" strokeWidth={7} opacity={0.85} />
      <line
        x1={73}
        y1={71}
        x2={92}
        y2={90}
        stroke="var(--color-ink)"
        strokeWidth={9}
        strokeLinecap="round"
        opacity={0.85}
      />
      <circle cx={46} cy={48} r={4.6} fill="var(--color-ink)" />
      <circle cx={62} cy={48} r={4.6} fill="var(--color-ink)" />
      <path d="M46 62 q 8 -7 16 0" stroke="var(--color-ink)" strokeWidth={4.5} strokeLinecap="round" fill="none" />
    </svg>
  );
}

function errorArt(): JSX.Element {
  return (
    <svg viewBox="0 0 120 120" className={ART} role="img" aria-label="An unplugged cable">
      <circle cx={60} cy={60} r={44} fill="var(--color-primary-soft)" />
      <rect x={20} y={50} width={34} height={22} rx={9} fill="var(--color-ink)" opacity={0.85} />
      <rect x={66} y={50} width={34} height={22} rx={9} fill="var(--color-primary)" />
      <path d="M54 61 h 8" stroke="var(--color-ink)" strokeWidth={5} strokeLinecap="round" opacity={0.35} />
      <path
        d="M60 34 l 6 10 M74 38 l -4 9 M46 38 l 4 9"
        stroke="var(--color-ink)"
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.6}
      />
    </svg>
  );
}

export function NoticePanel({ tone, title, message, actionLabel, onAction }: NoticePanelProps): JSX.Element {
  return (
    <div
      className="flex flex-col items-center gap-3.5 rounded-xl border-2 border-dashed border-line bg-surface px-4 py-[34px] text-center sm:px-6 sm:py-[52px]"
      role={tone === "error" ? "alert" : "status"}
    >
      {tone === "error" ? errorArt() : emptyArt()}
      <h3 className="text-[26px]">{title}</h3>
      <p className="max-w-[42ch] font-semibold text-ink-soft">{message}</p>
      {actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
