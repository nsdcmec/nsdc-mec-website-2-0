// src/pages/api/reset.ts
import type { APIRoute } from "astro";
import { store } from "../../lib/store";

export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  // Simple security
  if (key !== process.env.CACHE_RESET_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // Nuke the cache
  store.reset();

  return new Response(
    JSON.stringify({
      message: "Cache cleared. Next request will fetch fresh data.",
      timestamp: new Date().toISOString(),
    }),
    { status: 200 },
  );
};
