import { defineMiddleware } from "astro:middleware";
import { store } from "./lib/store";

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;
  const pathname = url.pathname;

  if (
    pathname.includes(".") ||
    pathname.startsWith("/_astro") ||
    pathname.startsWith("/api")
  ) {
    return next();
  }

  const cacheKey = pathname;
  const cachedHtml = store.getCachedHtml(cacheKey);

  if (cachedHtml) {
    const eTag = `"${cacheKey}-${store.lastFetched}"`;

    if (request.headers.get("if-none-match") === eTag) {
      console.log("client cache hit");
      return new Response(null, { status: 304 });
    }
    console.log("server cache hit");

    return new Response(cachedHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "public, max-age=30, stale-while-revalidate=3600",
        ETag: eTag,
        "X-Cache": "HIT",
      },
    });
  }

  const response = await next();
  console.log("cache miss");

  if (
    response.status === 200 &&
    response.headers.get("content-type")?.includes("text/html")
  ) {
    const html = await response.clone().text();
    store.setCachedHtml(cacheKey, html);

    const eTag = `"${cacheKey}-${store.lastFetched}"`;
    response.headers.set(
      "Cache-Control",
      "public, max-age=120, stale-while-revalidate=3600",
    );
    response.headers.set("ETag", eTag);
    response.headers.set("X-Cache", "MISS");
  }

  return response;
});
