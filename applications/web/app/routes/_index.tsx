import { useActionData } from "react-router";
import type { Route } from "./+types/_index";
import { baseUrl, linkService } from "@url-shortener/engine";
import { Layout } from "~/components/layout";
import { UrlForm } from "~/components/url-form";
import { ShortUrlResult } from "~/components/short-url-result";
import { Card } from "~/components/ui/card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Shorty – URL shortener" },
    { name: "description", content: "Shorten your URLs quickly and easily" },
  ];
}

// NOTE: input validation and error handling are added in a later step.
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const url = formData.get("url") as string;

  if (!url) {
    return { error: "URL is required" };
  }

  const link = await linkService.create(url);

  return { shortUrl: `${baseUrl}/s/${link.code}` };
}

export default function Index() {
  const actionData = useActionData<typeof action>();
  const error = actionData && "error" in actionData ? actionData.error : undefined;
  const shortUrl = actionData && "shortUrl" in actionData ? actionData.shortUrl : undefined;

  return (
    <Layout>
      <h1 className="text-3xl font-bold tracking-tight">Shorten a link</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Turn a long URL into a short one you can share.
      </p>
      <Card className="mt-6">
        <UrlForm error={error} />
      </Card>
      {shortUrl && <ShortUrlResult shortUrl={shortUrl} />}
    </Layout>
  );
}
