import { useEffect } from "react";
import { useRevalidator } from "react-router";
import type { Route } from "./+types/links";
import { baseUrl, linkService } from "@url-shortener/engine";
import { Layout } from "~/components/layout";
import { LinksTable } from "~/components/links-table";
import { Button } from "~/components/ui/button";
import type { LinkItem } from "~/lib/link-item";

export function meta({}: Route.MetaArgs) {
  return [{ title: "My links – Shorty" }];
}

export async function loader() {
  const links = await linkService.list();
  const items: LinkItem[] = links.map((link) => ({
    code: link.code,
    url: link.url,
    shortUrl: `${baseUrl}/s/${link.code}`,
    clicks: link.clicks,
    createdAt: link.createdAt.toISOString(),
  }));
  return { links: items };
}

export default function Links({ loaderData }: Route.ComponentProps) {
  const { revalidate, state } = useRevalidator();

  // Short links open in a new tab, so stats are stale when the user comes back.
  // Reload them whenever this tab regains focus.
  useEffect(() => {
    const onFocus = () => revalidate();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [revalidate]);

  return (
    <Layout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My links</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            All shortened links with click statistics.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => revalidate()}
          disabled={state === "loading"}
        >
          {state === "loading" ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      <LinksTable links={loaderData.links} />
    </Layout>
  );
}
