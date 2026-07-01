export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface FetchResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Headers
}

export interface FetchClient {
  get<T = unknown>(url: string, config?: RequestInit): Promise<FetchResponse<T>>
  post<T = unknown>(url: string, body?: unknown, config?: RequestInit): Promise<FetchResponse<T>>
  put<T = unknown>(url: string, body?: unknown, config?: RequestInit): Promise<FetchResponse<T>>
  patch<T = unknown>(url: string, body?: unknown, config?: RequestInit): Promise<FetchResponse<T>>
  delete<T = unknown>(url: string, config?: RequestInit): Promise<FetchResponse<T>>
}

function createClient(baseURL?: string): FetchClient {
  const buildUrl = (url: string) => {
    if (baseURL && !url.startsWith("http")) {
      return `${baseURL.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
    }
    return url
  }

  async function request<T = unknown>(
    method: Method,
    url: string,
    body?: unknown,
    config?: RequestInit,
  ): Promise<FetchResponse<T>> {
    const headers = new Headers(config?.headers)
    if (body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }

    const response = await fetch(buildUrl(url), {
      ...config,
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    let data: T
    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      data = (await response.json()) as T
    } else {
      data = (await response.text()) as unknown as T
    }

    if (!response.ok) {
      throw Object.assign(new Error(response.statusText), {
        status: response.status,
        statusText: response.statusText,
        data,
        headers: response.headers,
      })
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }
  }

  return {
    get: <T>(url: string, config?: RequestInit) => request<T>("GET", url, undefined, config),
    post: <T>(url: string, body?: unknown, config?: RequestInit) =>
      request<T>("POST", url, body, config),
    put: <T>(url: string, body?: unknown, config?: RequestInit) =>
      request<T>("PUT", url, body, config),
    patch: <T>(url: string, body?: unknown, config?: RequestInit) =>
      request<T>("PATCH", url, body, config),
    delete: <T>(url: string, config?: RequestInit) => request<T>("DELETE", url, undefined, config),
  }
}

export const client: FetchClient = createClient()
export const createServiceClient = (baseURL: string): FetchClient => createClient(baseURL)
