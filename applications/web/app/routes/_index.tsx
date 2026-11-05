import { data, useActionData } from "react-router";
import type { Route } from "./+types/_index";
import { baseUrl, InvalidUrlError, linkService } from "@url-shortener/engine";
import { Layout } from "~/components/layout";
import { UrlForm } from "~/components/url-form";
import { ShortUrlResult } from "~/components/short-url-result";
import { Card } from "~/components/ui/card";
import { clientKey, createLinkLimiter } from "~/.server/rate-limits";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Shorty – URL shortener" },
    { name: "description", content: "Shorten your URLs quickly and easily" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const limit = createLinkLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return data(
      { error: `Too many requests. Please try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const formData = await request.formData();
  const url = String(formData.get("url") ?? "");

  try {
    const link = await linkService.create(url);
    return { shortUrl: `${baseUrl}/s/${link.code}` };
  } catch (error) {
    // Validation errors have messages meant for the user.
    if (error instanceof InvalidUrlError) {
      return data({ error: error.message }, { status: 400 });
    }
    // Anything else is ours: log the details, show a generic message.
    console.error("Failed to create short link", error);
    return data({ error: "Something went wrong on our side. Please try again." }, { status: 500 });
  }
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
