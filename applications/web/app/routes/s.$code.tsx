import { redirect } from "react-router";
import type { Route } from "./+types/s.$code";
import { LinkNotFoundError, linkService } from "@url-shortener/engine";

export async function loader({ params }: Route.LoaderArgs) {
  try {
    // resolve() also records the click
    const url = await linkService.resolve(params.code);
    return redirect(url);
  } catch (error) {
    if (error instanceof LinkNotFoundError) {
      throw new Response("Not Found", { status: 404 });
    }
    throw error;
  }
}
