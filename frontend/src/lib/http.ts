const DEFAULT_TIMEOUT_MS = 15_000;

interface PostJsonOptions {
  timeoutMs?: number;
  keepalive?: boolean;
}

/** POSTs a JSON body with the headers and timeout every endpoint needs. */
export function postJson(
  url: string,
  body: unknown,
  { timeoutMs = DEFAULT_TIMEOUT_MS, keepalive }: PostJsonOptions = {},
): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    keepalive,
  });
}

/** PUTs a JSON body with the headers and timeout every endpoint needs. */
export function putJson(
  url: string,
  body: unknown,
  { timeoutMs = DEFAULT_TIMEOUT_MS }: PostJsonOptions = {},
): Promise<Response> {
  return fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export interface JsonParser<T> {
  safeParse(data: unknown): { success: true; data: T } | { success: false };
}

export type JsonRequestResult<T> =
  | { status: 'success'; data: T }
  | { status: 'not-found' }
  | { status: 'failed' };

/**
 * Runs a JSON request, maps 404 to `not-found`, and validates 2xx payloads
 * through `parser` so feature modules stay free of `try`/`catch` and `unknown`.
 */
export async function requestJson<T>(
  send: () => Promise<Response>,
  parser: JsonParser<T>,
): Promise<JsonRequestResult<T>> {
  let response: Response;

  try {
    response = await send();
  } catch {
    return { status: 'failed' };
  }

  if (response.status === 404) return { status: 'not-found' };

  if (!response.ok) return { status: 'failed' };

  try {
    const body: unknown = await response.json();
    const parsed = parser.safeParse(body);

    return parsed.success
      ? { status: 'success', data: parsed.data }
      : { status: 'failed' };
  } catch {
    return { status: 'failed' };
  }
}

interface GetJsonOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

/** GETs a resource with the timeout every endpoint needs. */
export function getJson(
  url: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS, signal }: GetJsonOptions = {},
): Promise<Response> {
  return fetch(url, {
    headers: { Accept: 'application/json' },
    signal: signal
      ? AbortSignal.any([AbortSignal.timeout(timeoutMs), signal])
      : AbortSignal.timeout(timeoutMs),
  });
}
