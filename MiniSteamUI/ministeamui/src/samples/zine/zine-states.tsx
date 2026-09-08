import type { JSX } from "react";

export interface ZineSkeletonGridProps {
  /** How many placeholder cards to print. */
  count?: number;
}

/** Loading placeholders drawn as blank, hatched printer plates. */
export function ZineSkeletonGrid({ count = 3 }: ZineSkeletonGridProps): JSX.Element {
  return (
    <div className="zine-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="zine-skeleton" key={index}>
          <div className="zine-skeleton__art" />
          <div className="zine-skeleton__bar zine-skeleton__bar--short" />
          <div className="zine-skeleton__bar" />
          <div className="zine-skeleton__bar zine-skeleton__bar--mid" />
        </div>
      ))}
    </div>
  );
}

export interface ZineNoticeProps {
  /** Small mono line above the headline. */
  kicker: string;
  /** Big display headline. */
  title: string;
  /** Explanatory sentence. */
  message: string;
  /** Optional recovery action. */
  actionLabel?: string;
  /** Handler for the recovery action. */
  onAction?: () => void;
  /** Disables the action while a retry is in flight. */
  isBusy?: boolean;
}

/** Shared panel for the empty-search and error states. */
export function ZineNotice({
  kicker,
  title,
  message,
  actionLabel,
  onAction,
  isBusy = false,
}: ZineNoticeProps): JSX.Element {
  return (
    <div className="zine-notice" role="status">
      <span className="zine-kicker">{kicker}</span>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          className="zine-btn zine-btn--blue"
          onClick={onAction}
          disabled={isBusy}
        >
          {isBusy ? "Trying..." : actionLabel}
        </button>
      ) : null}
    </div>
  );
}
