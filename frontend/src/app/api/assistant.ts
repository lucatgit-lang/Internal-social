/**
 * File Overview: assistant.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { apiGet, apiPatch, apiPost } from "./client";

export interface AssistantHistoryApiItem {
  id: string;
  command: string;
  response: string;
  route?: string;
  createdAt: string;
}

export interface AssistantTaskApiItem {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "done";
  dueDate: string;
  route: string;
  owner?: string;
  source?: "assistant";
}

export interface AssistantEnhancedResponseApi {
  text: string;
  suggestion?: string;
  cta?: string;
  tasks?: Array<{
    title: string;
    description?: string;
    priority?: "high" | "medium" | "low";
    dueDate?: string;
    route?: string;
    owner?: string;
  }>;
  scope: "in_scope" | "out_of_scope";
  source: "groq" | "local_fallback";
}

/**
 * assistantRespond: descrive il comportamento principale di questa funzione.
 * @param payload Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function assistantRespond(payload: unknown): Promise<AssistantEnhancedResponseApi> {
  return apiPost<AssistantEnhancedResponseApi>("/api/v1/assistant/respond", payload);
}

/**
 * getAssistantHistory: descrive il comportamento principale di questa funzione.
 * @param params Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */

export async function getAssistantHistory(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ data: AssistantHistoryApiItem[] }> {
  const query = new URLSearchParams();
  if (params?.limit != null) query.set("limit", String(params.limit));
  if (params?.offset != null) query.set("offset", String(params.offset));
  const suffix = query.toString();
  return apiGet<{ data: AssistantHistoryApiItem[] }>(`/api/v1/assistant/history${suffix ? `?${suffix}` : ""}`);
}

/**
 * createAssistantHistory: descrive il comportamento principale di questa funzione.
 * @param payload Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */

export async function createAssistantHistory(payload: {
  command: string;
  response: string;
  route?: string;
}): Promise<{ data: AssistantHistoryApiItem }> {
  return apiPost<{ data: AssistantHistoryApiItem }>("/api/v1/assistant/history", payload);
}

/**
 * getAssistantTasks: descrive il comportamento principale di questa funzione.
 * @param params Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */

export async function getAssistantTasks(params?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<{ data: AssistantTaskApiItem[] }> {
  const query = new URLSearchParams();
  if (params?.limit != null) query.set("limit", String(params.limit));
  if (params?.offset != null) query.set("offset", String(params.offset));
  if (params?.status) query.set("status", params.status);
  const suffix = query.toString();
  return apiGet<{ data: AssistantTaskApiItem[] }>(`/api/v1/assistant/tasks${suffix ? `?${suffix}` : ""}`);
}

/**
 * createAssistantTask: descrive il comportamento principale di questa funzione.
 * @param payload Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function createAssistantTask(payload: Omit<AssistantTaskApiItem, "id">): Promise<{ data: AssistantTaskApiItem }> {
  return apiPost<{ data: AssistantTaskApiItem }>("/api/v1/assistant/tasks", payload);
}

/**
 * patchAssistantTask: descrive il comportamento principale di questa funzione.
 * @param id Input richiesto dalla funzione.
 * @param payload Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */

export async function patchAssistantTask(
  id: string,
  payload: Partial<Pick<AssistantTaskApiItem, "status" | "priority" | "dueDate">>
): Promise<{ success: true }> {
  return apiPatch<{ success: true }>(`/api/v1/assistant/tasks/${id}`, payload);
}
