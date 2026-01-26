const DEFAULT_BASE_URL = "http://localhost:8133/api";

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return envUrl && envUrl.trim() ? envUrl.trim() : DEFAULT_BASE_URL;
};

const buildUrl = (path: string) => {
  const base = getBaseUrl().replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
};

type RequestOptions = RequestInit & {
  json?: unknown;
};

const buildHeaders = (options?: RequestOptions) => {
  const headers = new Headers(options?.headers);
  if (!headers.has("Content-Type") && options?.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
};

const parseError = async (response: Response) => {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return parsed?.message || parsed?.error || text || response.statusText;
  } catch {
    return text || response.statusText;
  }
};

export async function requestJson<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: buildHeaders(options),
    body: options?.json !== undefined ? JSON.stringify(options.json) : options?.body,
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message || `HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function requestBlob(path: string, options?: RequestOptions): Promise<Blob> {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: buildHeaders(options),
    body: options?.json !== undefined ? JSON.stringify(options.json) : options?.body,
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message || `HTTP ${response.status}`);
  }

  return await response.blob();
}
