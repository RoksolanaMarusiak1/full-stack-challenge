import type { LinkItem } from "~/lib/link-item";
import { CopyButton } from "./copy-button";
import { Card } from "./ui/card";

// Fixed locale and time zone, so the server and the browser render the same text.
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

export function LinksTable({ links }: { links: LinkItem[] }) {
  if (links.length === 0) {
    return (
      <Card className="text-center text-sm text-ink-soft">
        No links yet. Shorten your first URL on the home page.
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line font-mono text-xs uppercase tracking-[0.15em] text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Short link</th>
            <th className="px-4 py-3 font-medium">Original URL</th>
            <th className="px-4 py-3 text-right font-medium">Clicks</th>
            <th className="px-4 py-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {links.map((link) => (
            <tr key={link.code}>
              <td className="px-4 py-3 font-mono font-medium">
                <div className="flex items-center gap-2">
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-strong hover:underline"
                  >
                    {link.shortUrl}
                  </a>
                  <CopyButton
                    text={link.shortUrl}
                    variant="ghost"
                    iconOnly
                    ariaLabel={`Copy short link ${link.code}`}
                  />
                </div>
              </td>
              <td className="max-w-[12rem] truncate px-4 py-3 text-ink-soft" title={link.url}>
                {link.url}
              </td>
              <td className="px-4 py-3 text-right font-mono font-medium tabular-nums">
                {link.clicks}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                {dateFormat.format(new Date(link.createdAt))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
