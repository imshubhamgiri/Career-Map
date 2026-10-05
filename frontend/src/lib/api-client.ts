import { env } from "@core/config/env";

export class ApiError extends Error {
  readonly status: number;
  readonly data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

let refreshPromise: Promise<boolean> | null = null;

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private buildUrl(
    endpoint: string,
    params?: RequestOptions["params"],
  ): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  private async refreshSession(): Promise<boolean> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        return response.ok;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { params, body, headers: customHeaders, ...requestInit } = options;
    const headers = new Headers(customHeaders);
    let resolvedBody: BodyInit | undefined;

    if (body !== undefined) {
      if (
        typeof body === "string" ||
        body instanceof FormData ||
        body instanceof Blob ||
        body instanceof URLSearchParams
      ) {
        resolvedBody = body;
      } else {
        headers.set("Content-Type", "application/json");
        resolvedBody = JSON.stringify(body);
      }
    }

    const requestConfig: RequestInit = {
      ...requestInit,
      credentials: "include",
      headers,
      body: resolvedBody,
    };

    let response = await this.fetch(endpoint, params, requestConfig);
    const isAuthRoute =
      endpoint.includes("/auth/login") || endpoint.includes("/auth/refresh");

    if (response.status === 401 && !isAuthRoute) {
      const refreshed = await this.refreshSession();
      if (refreshed) {
        response = await this.fetch(endpoint, params, requestConfig);
      }
    }

    return this.parseResponse<T>(response);
  }

  private async fetch(
    endpoint: string,
    params: RequestOptions["params"],
    config: RequestInit,
  ): Promise<Response> {
    try {
      return await fetch(this.buildUrl(endpoint, params), config);
    } catch (cause) {
      throw new ApiError(
        0,
        cause instanceof Error ? cause.message : "Network error",
      );
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) return {} as T;

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text();

    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : response.statusText || "An unexpected error occurred.";

      throw new ApiError(response.status, message, payload);
    }

    return payload as T;
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient(env.apiUrl);
