import axios, { AxiosError, AxiosInstance } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20000,
});

let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const original = err.config as any;
    if (
      err.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/refresh")
    ) {
      original._retry = true;
      if (!refreshing) {
        refreshing = api
          .post("/auth/refresh")
          .then(() => undefined)
          .catch(() => undefined)
          .finally(() => {
            refreshing = null;
          });
      }
      await refreshing;
      return api(original);
    }
    return Promise.reject(err);
  },
);

/** Unwrap server response { success, data } envelope. */
export async function unwrap<T = any>(p: Promise<any>): Promise<T> {
  const res = await p;
  return res.data?.data ?? res.data;
}

export async function apiGet<T = any>(path: string, params?: Record<string, any>): Promise<T> {
  return unwrap<T>(api.get(path, { params }));
}

export async function apiPost<T = any>(path: string, body?: any): Promise<T> {
  return unwrap<T>(api.post(path, body));
}

export async function apiPatch<T = any>(path: string, body?: any): Promise<T> {
  return unwrap<T>(api.patch(path, body));
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  return unwrap<T>(api.delete(path));
}

/** Server-side fetch (used in RSC). Always direct, no cookies. */
export async function serverFetch<T = any>(
  path: string,
  init?: RequestInit & { revalidate?: number; tag?: string },
): Promise<T | null> {
  const url = `${API_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...init,
      next: {
        revalidate: init?.revalidate ?? 60,
        tags: init?.tag ? [init.tag] : undefined,
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as T;
  } catch {
    return null;
  }
}
