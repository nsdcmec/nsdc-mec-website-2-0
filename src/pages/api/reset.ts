import type { APIRoute } from "astro";
import { store } from "../../lib/store";
import { dataService } from "../../lib/data-service";

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get("x-api-key");
  const url = new URL(request.url);
  const queryKey = url.searchParams.get("key");

  const receivedKey = authHeader || queryKey;
  const secretKey = process.env.CACHE_RESET_KEY;

  if (!secretKey || receivedKey !== secretKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("[API]  Cache reset triggered via API");

  store.reset();

  try {
    await dataService.getInitialData();
    console.log("[API]  Data successfully refreshed");
  } catch (e) {
    console.error("[API]  Failed to refresh data:", e);
    return new Response(JSON.stringify({ error: "Refetch failed" }), {
      status: 500,
    });
  }

  return new Response(
    JSON.stringify({
      message: "Cache cleared and data refreshed.",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
