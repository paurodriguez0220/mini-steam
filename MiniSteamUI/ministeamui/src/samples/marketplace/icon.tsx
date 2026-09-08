import type { JSX } from "react";

export type IconName =
  | "search"
  | "menu"
  | "close"
  | "play"
  | "sun"
  | "moon"
  | "grid"
  | "filter"
  | "library"
  | "external"
  | "alert"
  | "arrow-left";

export interface IconProps {
  name: IconName;
  /** Square size in px. Defaults to 14 to suit the dense UI. */
  size?: number;
  className?: string;
}

const PATHS: Record<IconName, JSX.Element> = {
  search: (
    <>
      <circle cx="7" cy="7" r="5" />
      <path d="M10.8 10.8 14.5 14.5" />
    </>
  ),
  menu: <path d="M2 4h12M2 8h12M2 12h12" />,
  close: <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />,
  play: <path d="M4 2.8 13 8l-9 5.2z" fill="currentColor" stroke="none" />,
  sun: (
    <>
      <circle cx="8" cy="8" r="3.2" />
      <path d="M8 .8v2M8 13.2v2M.8 8h2M13.2 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M13.1 2.9l-1.4 1.4M4.3 11.7l-1.4 1.4" />
    </>
  ),
  moon: <path d="M13.2 9.6A5.8 5.8 0 0 1 6.4 2.8a5.8 5.8 0 1 0 6.8 6.8z" />,
  grid: (
    <>
      <rect x="2" y="2" width="5" height="5" />
      <rect x="9" y="2" width="5" height="5" />
      <rect x="2" y="9" width="5" height="5" />
      <rect x="9" y="9" width="5" height="5" />
    </>
  ),
  filter: <path d="M1.5 3h13l-5 5.6V14l-3-1.8V8.6z" />,
  library: (
    <>
      <rect x="2" y="2.5" width="3.4" height="11" />
      <rect x="6.8" y="2.5" width="3.4" height="11" />
      <path d="M11.8 3.6 14.4 13" />
    </>
  ),
  external: (
    <>
      <path d="M9 2.5h4.5V7" />
      <path d="M13.5 2.5 7.5 8.5" />
      <path d="M12 9.8v3.7H2.5V4h3.8" />
    </>
  ),
  alert: (
    <>
      <path d="M8 1.8 15 14H1z" />
      <path d="M8 6.2v3.4M8 11.4v.9" />
    </>
  ),
  "arrow-left": <path d="M13 8H3M6.6 4.4 3 8l3.6 3.6" />,
};

/** Single inline-SVG icon set so the sample ships no image or icon dependency. */
export function Icon({ name, size = 14, className }: IconProps): JSX.Element {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
