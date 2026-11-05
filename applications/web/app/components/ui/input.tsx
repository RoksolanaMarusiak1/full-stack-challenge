import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function Input({ invalid = false, className = "", ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`block w-full rounded-xl border-0 bg-paper px-3.5 py-2.5 font-mono text-sm text-ink ring-1 ring-inset placeholder:text-ink-muted/70 focus:outline-hidden focus:ring-2 focus:ring-inset focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_18%,transparent)] ${
        invalid
          ? "ring-accent focus:ring-accent-strong"
          : "ring-line focus:ring-accent"
      } ${className}`}
      {...props}
    />
  );
}
