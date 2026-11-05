import type { Route } from "./+types/links";
import { baseUrl, linkService } from "@url-shortener/engine";
import { Layout } from "~/components/layout";
import { LinksTable } from "~/components/links-table";
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
  return (
    <Layout>
      <h1 className="text-3xl font-bold tracking-tight">My links</h1>
      <p className="mt-2 mb-6 text-gray-600 dark:text-gray-400">
        All shortened links with click statistics.
      </p>
      <LinksTable links={loaderData.links} />
    </Layout>
  );
}
