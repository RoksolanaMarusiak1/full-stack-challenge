import type { LinkItem } from "~/lib/link-item";
import { Card } from "./ui/card";

export function LinksTable({ links }: { links: LinkItem[] }) {
  if (links.length === 0) {
    return (
      <Card className="text-center text-sm text-gray-500 dark:text-gray-400">
        No links yet. Shorten your first URL on the home page.
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3 font-medium">Short link</th>
            <th className="px-4 py-3 font-medium">Original URL</th>
            <th className="px-4 py-3 text-right font-medium">Clicks</th>
            <th className="px-4 py-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {links.map((link) => (
            <tr key={link.code}>
              <td className="px-4 py-3 font-medium">
                <a
                  href={link.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {link.shortUrl}
                </a>
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-gray-600 dark:text-gray-300" title={link.url}>
                {link.url}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{link.clicks}</td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                {new Date(link.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
