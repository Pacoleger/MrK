// ============================================================
// Cloudflare Pages Function: Reverse-Proxy für API
// Leitet /api/* Requests an den Cloudflare Worker weiter.
// Dadurch sind Frontend und API auf derselben Origin (Same-Site).
// ============================================================

interface Env {
  API_URL?: string;
}

const DEFAULT_API_URL = "https://mrk-api.pacokamegne.workers.dev";

export const onRequest: PagesFunction<Env> = async (context) => {
  const apiUrl = context.env.API_URL || DEFAULT_API_URL;
  const url = new URL(context.request.url);
  const targetUrl = `${apiUrl}${url.pathname}${url.search}`;

  // Body lesen (nur wenn nicht GET/HEAD)
  const body =
    context.request.method === "GET" || context.request.method === "HEAD"
      ? undefined
      : await context.request.arrayBuffer();

  // Header vorbereiten
  const headers = new Headers(context.request.headers);
  headers.set("Host", new URL(apiUrl).host);

  // Upstream-Request
  const upstream = await fetch(targetUrl, {
    method: context.request.method,
    headers,
    body,
    redirect: "manual",
  });

  // Response-Header kopieren
  const responseHeaders = new Headers(upstream.headers);

  // Optional: Set-Cookie-Domain auf Pages-Domain setzen
  // (falls Worker Domain-Attribut setzt, entfernen)
  const setCookie = responseHeaders.get("Set-Cookie");
  if (setCookie && setCookie.includes("Domain=")) {
    // Domain-Attribut entfernen → Cookie gilt für Pages-Domain
    const cleaned = setCookie.replace(/;\s*Domain=[^;]+/gi, "");
    responseHeaders.set("Set-Cookie", cleaned);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
};
