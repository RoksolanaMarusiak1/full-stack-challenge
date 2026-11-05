import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function ShortUrlResult({ shortUrl }: { shortUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (insecure context, permissions): the link stays selectable.
      setCopied(false);
    }
  }

  return (
    <Card className="mt-6">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        Your short link
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-lg font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          {shortUrl}
        </a>
        <Button variant="secondary" onClick={copy} aria-live="polite">
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    </Card>
  );
}
