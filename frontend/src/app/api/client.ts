/**
 * File Overview: client.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * resolveApiBaseUrl: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function resolveApiBaseUrl(): string {
  const envBase = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL;
  if (envBase && envBase.trim()) return envBase.trim().replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:5180";
}

/**
 * getAccessToken: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("hideddy_access_token");
}

/**
 * getRefreshToken: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("hideddy_refresh_token");
}

/**
 * apiGet: descrive il comportamento principale di questa funzione.
 * @param path Input richiesto dalla funzione.
 * @param timeoutMs Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */
export async function apiGet<T>(path: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  return apiRequest<T>(path, "GET", undefined, timeoutMs);
}

/**
 * apiPost: descrive il comportamento principale di questa funzione.
 * @param path Input richiesto dalla funzione.
 * @param timeoutMs Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */
export async function apiPost<T>(path: string, body?: unknown, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  return apiRequest<T>(path, "POST", body, timeoutMs);
}

/**
 * apiPatch: descrive il comportamento principale di questa funzione.
 * @param path Input richiesto dalla funzione.
 * @param timeoutMs Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */
export async function apiPatch<T>(path: string, body?: unknown, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  return apiRequest<T>(path, "PATCH", body, timeoutMs);
}

/**
 * setAccessToken: descrive il comportamento principale di questa funzione.
 * @param token Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (!token) {
    window.localStorage.removeItem("hideddy_access_token");
    return;
  }
  window.localStorage.setItem("hideddy_access_token", token);
}

/**
 * saveSessionTokens: descrive il comportamento principale di questa funzione.
 * @param accessToken Input richiesto dalla funzione.
 * @param refreshToken Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function saveSessionTokens(accessToken: string, refreshToken?: string): void {
  setAccessToken(accessToken);
  if (typeof window === "undefined") return;
  if (refreshToken) {
    window.localStorage.setItem("hideddy_refresh_token", refreshToken);
  }
}

/**
 * clearSessionTokens: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function clearSessionTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("hideddy_access_token");
  window.localStorage.removeItem("hideddy_refresh_token");
}

/**
 * apiRequest: descrive il comportamento principale di questa funzione.
 * @param path Input richiesto dalla funzione.
 * @param method Input richiesto dalla funzione.
 * @param body Input richiesto dalla funzione.
 * @param timeoutMs Input richiesto dalla funzione.
 * @param allowRefresh Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */

async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" | "PATCH",
  body?: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  allowRefresh = true
): Promise<T> {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {};
    const token = getAccessToken();
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
    if (body != null) {
      headers["content-type"] = "application/json";
    }

    let response = await fetch(`${resolveApiBaseUrl()}${path}`, {
      method,
      headers,
      body: body == null ? undefined : JSON.stringify(body),
      signal: controller.signal
    });

    const canAttemptRefresh =
      allowRefresh &&
      response.status === 401 &&
      path !== "/api/v1/auth/login" &&
      path !== "/api/v1/auth/refresh";

    if (canAttemptRefresh) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        const refreshResponse = await fetch(`${resolveApiBaseUrl()}/api/v1/auth/refresh`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ refreshToken }),
          signal: controller.signal
        });

        if (refreshResponse.ok) {
          const refreshed = (await refreshResponse.json()) as {
            accessToken: string;
            refreshToken: string;
          };
          saveSessionTokens(refreshed.accessToken, refreshed.refreshToken);
          const retryHeaders: Record<string, string> = {
            authorization: `Bearer ${refreshed.accessToken}`
          };
          if (body != null) {
            retryHeaders["content-type"] = "application/json";
          }
          response = await fetch(`${resolveApiBaseUrl()}${path}`, {
            method,
            headers: retryHeaders,
            body: body == null ? undefined : JSON.stringify(body),
            signal: controller.signal
          });
        } else {
          clearSessionTokens();
        }
      } else {
        clearSessionTokens();
      }
    }

    if (!response.ok) {
      throw new Error(`API_GET_FAILED:${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    globalThis.clearTimeout(timer);
  }
}

