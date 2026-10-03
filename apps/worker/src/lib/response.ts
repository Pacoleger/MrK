import type { ApiResponse, ApiSuccess, ApiError } from "../types";

const DEFAULT_HEADERS: HeadersInit = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

/**
 * Success response
 */
export function ok<T>(data: T, init?: ResponseInit): Response {
  const body: ApiSuccess<T> = { success: true, data };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: DEFAULT_HEADERS,
    ...init,
  });
}

/**
 * Error response
 */
export function fail(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): Response {
  const body: ApiError = {
    success: false,
    error: { code, message, details },
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: DEFAULT_HEADERS,
  });
}

/**
 * Not Found
 */
export function notFound(message = "Resource not found"): Response {
  return fail("NOT_FOUND", message, 404);
}

/**
 * Method Not Allowed
 */
export function methodNotAllowed(allowed: string[]): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Method not allowed",
        details: { allowed },
      },
    }),
    {
      status: 405,
      headers: {
        ...DEFAULT_HEADERS,
        Allow: allowed.join(", "),
      },
    }
  );
}

/**
 * Internal Server Error
 */
export function serverError(message = "Internal server error"): Response {
  return fail("INTERNAL_ERROR", message, 500);
}
