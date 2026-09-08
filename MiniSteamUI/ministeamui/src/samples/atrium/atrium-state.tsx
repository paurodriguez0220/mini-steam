import type { JSX, ReactNode } from "react";

export interface AtriumStateProps {
  /** Small uppercase kicker above the message. */
  kicker: string;
  title: string;
  description: string;
  /** Optional recovery actions (clear search, retry). */
  children?: ReactNode;
}

/** Editorial empty / error block - a sentence and a way out, nothing more. */
export function AtriumState({ kicker, title, description, children }: AtriumStateProps): JSX.Element {
  return (
    <div className="at-state at-reveal" role="status">
      <p className="at-eyebrow at-eyebrow--accent">{kicker}</p>
      <h3 className="at-state__title">{title}</h3>
      <p className="at-state__text">{description}</p>
      {children ? <div className="at-state__actions">{children}</div> : null}
    </div>
  );
}
