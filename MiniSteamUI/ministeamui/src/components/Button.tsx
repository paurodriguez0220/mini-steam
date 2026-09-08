import type { ButtonHTMLAttributes, JSX } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `primary` is the confident red key button; `ghost` is the bordered surface button. */
  variant?: "primary" | "ghost";
  /** `lg` is the sample's `--big` modifier: taller, roomier, bigger type. */
  size?: "md" | "lg";
}

/**
 * The sample transitioned transform, box-shadow and background-color on separate
 * timings. Tailwind's translate/scale utilities set the individual `translate` and
 * `scale` properties rather than `transform`, so those are the names the transition
 * has to list - one duration and one easing per property, in the same order.
 */
const MOTION =
  "transition-[translate,scale,box-shadow,background-color] " +
  "duration-[340ms,340ms,220ms,180ms] " +
  "ease-[var(--ease-spring),var(--ease-spring),var(--ease-soft),var(--ease-soft)]";

/** `min-h-11` is the 44px touch-target floor; the size classes raise it from there. */
const BASE =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-[9px] " +
  "rounded-full font-display font-extrabold tracking-[-0.01em]";

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "border-0 bg-primary text-primary-ink " +
    "[box-shadow:0_5px_0_var(--color-primary-deep),var(--shadow-soft-2)] " +
    "hover:-translate-y-[3px] " +
    "hover:[box-shadow:0_8px_0_var(--color-primary-deep),var(--shadow-soft-3)] " +
    "active:translate-y-[4px] active:scale-y-[0.94] " +
    "active:[box-shadow:0_1px_0_var(--color-primary-deep),var(--shadow-soft-press)]",
  ghost:
    "border-2 border-line bg-surface text-ink shadow-soft-1 " +
    "hover:-translate-y-[3px] hover:shadow-soft-2 " +
    "active:translate-y-0 active:scale-[0.95] active:shadow-soft-press",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  md: "min-h-12 px-[22px] py-3 text-[16px]",
  lg: "min-h-[58px] px-[30px] py-3.5 text-[19px]",
};

export function Button({
  variant = "ghost",
  size = "md",
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <button
      type={type}
      className={`${BASE} ${MOTION} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
