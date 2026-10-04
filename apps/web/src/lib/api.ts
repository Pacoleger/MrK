// ============================================================
// API Client für Cloudflare Worker Backend
// ============================================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://mrk-api.pacokamegne.workers.dev";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "ApiError";
  }
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Basis-Fetch mit Fehlerbehandlung.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json: ApiResponse<T>;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(
      "INVALID_RESPONSE",
      `Server returned invalid JSON (HTTP ${response.status})`,
      response.status
    );
  }

  if (!json.success) {
    throw new ApiError(
      json.error.code,
      json.error.message,
      response.status
    );
  }

  return json.data;
}

/**
 * GET-Request
 */
export function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "GET" });
}

/**
 * POST-Request
 */
export function apiPost<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "POST", body });
}

/**
 * PUT-Request
 */
export function apiPut<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "PUT", body });
}

/**
 * DELETE-Request
 */
export function apiDelete<T>(
  path: string,
  options?: RequestOptions
): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "DELETE" });
}
