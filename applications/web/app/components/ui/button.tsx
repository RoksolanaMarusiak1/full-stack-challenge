import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-linear-to-b from-primary to-primary-strong text-white shadow-[0_6px_16px_-6px_var(--primary)] hover:-translate-y-px hover:shadow-[0_10px_22px_-6px_var(--primary)] focus-visible:outline-accent",
  secondary:
    "bg-paper text-ink ring-1 ring-inset ring-line hover:-translate-y-px hover:bg-card hover:shadow-[0_6px_16px_-8px_var(--ink-muted)] focus-visible:outline-accent",
  ghost: "text-ink-soft hover:bg-card hover:text-ink focus-visible:outline-accent",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-150 active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:translate-y-0 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
