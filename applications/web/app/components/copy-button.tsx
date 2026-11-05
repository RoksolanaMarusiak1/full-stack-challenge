import { useState } from "react";
import { Button } from "./ui/button";

type CopyButtonProps = {
  text: string;
  variant?: "secondary" | "ghost";
  className?: string;
  /** Show only an icon (for tight spaces such as table rows). Then `ariaLabel` is required. */
  iconOnly?: boolean;
  ariaLabel?: string;
};

const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  width: 16,
  height: 16,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function CopyIcon() {
  return (
    <svg {...iconProps}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function CopyButton({
  text,
  variant = "secondary",
  className = "",
  iconOnly = false,
  ariaLabel,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (insecure context, permissions): the link stays selectable.
      setCopied(false);
    }
  }

  if (iconOnly) {
    return (
      <Button
        variant={variant}
        onClick={copy}
        aria-label={copied ? "Copied" : ariaLabel}
        title={copied ? "Copied" : ariaLabel}
        className={`size-8 p-0! ${copied ? "text-accent-strong" : ""} ${className}`}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      onClick={copy}
      aria-label={ariaLabel}
      aria-live="polite"
      className={className}
    >
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}
