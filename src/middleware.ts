import { defineMiddleware } from "astro:middleware";
import { store } from "./lib/store";

const isDev = process.env.NODE_ENV === "development";

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;

  // Safer cache key formulation: pathname only, no query params, stripped trailing slash
  let cacheKey = url.pathname.replace(/\/$/, "") || "/";

  if (
    cacheKey.includes(".") ||
    cacheKey.startsWith("/_astro") ||
    cacheKey.startsWith("/api")
  ) {
    return next();
  }

  const eTag = `"${cacheKey}-${store.lastFetched}"`;

  if (request.headers.get("if-none-match") === eTag && !isDev) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: eTag,
        "Cache-Control": "public, max-age=120, stale-while-revalidate=3600",
      },
    });
  }

  const cachedContent = store.getCachedHtml(cacheKey);

  if (cachedContent && !isDev) {
    return new Response(cachedContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "public, max-age=120, stale-while-revalidate=3600",
        ETag: eTag,
        "X-Cache": "HIT",
      },
    });
  }

  const response = await next();

  if (
    response.status === 200 &&
    response.headers.get("content-type")?.includes("text/html")
  ) {
    const html = await response.clone().text();
    store.setCachedHtml(cacheKey, html);

    response.headers.set(
      "Cache-Control",
      "public, max-age=120, stale-while-revalidate=3600",
    );
    response.headers.set("ETag", eTag);
    response.headers.set("X-Cache", "MISS");
  }

  return response;
});
