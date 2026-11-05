import { CopyButton } from "./copy-button";

export function ShortUrlResult({ shortUrl }: { shortUrl: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-line border-l-4 border-l-accent bg-card p-6 shadow-[0_0_36px_-10px_var(--accent)]">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
        Your short link
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-mono text-lg font-medium text-accent-strong hover:underline"
        >
          {shortUrl}
        </a>
        <CopyButton text={shortUrl} />
      </div>
    </div>
  );
}
