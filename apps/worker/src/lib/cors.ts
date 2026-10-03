// Erlaubte Origins für CORS.
// In Production nur die eigene Domain, in Dev breiter.
const ALLOWED_ORIGINS = [
  "https://mrk-6uj.pages.dev",
  "https://mrk-web.pages.dev",
  "http://localhost:3000",
];

export function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin") ?? "";
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith(".mrk-6uj.pages.dev") ||
    origin.endsWith(".pages.dev") ||
    origin.startsWith("http://localhost");

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * Handle preflight request
 */
export function handlePreflight(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

/**
 * Add CORS headers to an existing response
 */
export function withCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  const cors = getCorsHeaders(request);
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value as string);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
