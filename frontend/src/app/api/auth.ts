/**
 * File Overview: auth.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { apiGet, apiPost, clearSessionTokens, saveSessionTokens } from "./client";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}

interface MeResponse {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}

/**
 * loginWithPassword: descrive il comportamento principale di questa funzione.
 * @param email Input richiesto dalla funzione.
 * @param password Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function loginWithPassword(email: string, password: string): Promise<LoginResponse["user"]> {
  const data = await apiPost<LoginResponse>("/api/v1/auth/login", { email, password });
  saveSessionTokens(data.accessToken, data.refreshToken);
  return data.user;
}

/**
 * getAuthenticatedUser: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getAuthenticatedUser(): Promise<MeResponse["user"]> {
  const data = await apiGet<MeResponse>("/api/v1/auth/me");
  return data.user;
}

/**
 * logoutLocalSession: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function logoutLocalSession(): void {
  clearSessionTokens();
}

/**
 * logoutRemoteSession: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function logoutRemoteSession(): Promise<void> {
  try {
    await apiPost<{ success: boolean }>("/api/v1/auth/logout");
  } catch {
    // Session can already be invalid; clear local tokens anyway.
  } finally {
    clearSessionTokens();
  }
}
