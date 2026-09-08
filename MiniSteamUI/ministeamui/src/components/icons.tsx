import type { JSX } from "react";

export interface IconProps {
  /** Square size in px. */
  size?: number;
}

function base(size: number): { width: number; height: number; viewBox: string } {
  return { width: size, height: size, viewBox: "0 0 24 24" };
}

export function SearchIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden="true">
      <circle cx={11} cy={11} r={6.5} />
      <line x1={16} y1={16} x2={21} y2={21} />
    </svg>
  );
}

export function CloseIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" aria-hidden="true">
      <line x1={6} y1={6} x2={18} y2={18} />
      <line x1={18} y1={6} x2={6} y2={18} />
    </svg>
  );
}

export function MenuIcon({ size = 20 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" aria-hidden="true">
      <line x1={4} y1={7} x2={20} y2={7} />
      <line x1={4} y1={12} x2={20} y2={12} />
      <line x1={4} y1={17} x2={20} y2={17} />
    </svg>
  );
}

export function PlayIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} fill="currentColor" aria-hidden="true">
      <path d="M8 5.4c0-1.2 1.3-1.9 2.3-1.3l8.2 5.1c1 .6 1 2.1 0 2.7l-8.2 5.1c-1 .6-2.3-.1-2.3-1.3V5.4Z" />
    </svg>
  );
}

export function BackIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 6l-6 6 6 6" />
    </svg>
  );
}

export function SunIcon({ size = 20 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
      <circle cx={12} cy={12} r={4.4} />
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
    </svg>
  );
}

export function MoonIcon({ size = 20 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} fill="currentColor" aria-hidden="true">
      <path d="M20 14.2A8.4 8.4 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
    </svg>
  );
}

export function ControllerIcon({ size = 22 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
      <path d="M8 4.5h8a5.5 5.5 0 0 1 5.5 5.5v6.2a3.3 3.3 0 0 1-6 1.9l-.8-1.2H9.3l-.8 1.2a3.3 3.3 0 0 1-6-1.9V10A5.5 5.5 0 0 1 8 4.5Z" />
      <path d="M7 9.6v3.2M5.4 11.2h3.2M15.6 10.4h.02M18 12.6h.02" />
    </svg>
  );
}
