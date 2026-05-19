/**
 * File Overview: history.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { createAssistantHistory, getAssistantHistory } from "../api/assistant";

export interface AssistantHistoryEntry {
  id: string;
  command: string;
  response: string;
  route?: string;
  createdAt: number;
}

export const HISTORY_UPDATED_EVENT = "assistant:history-updated";

let historyCache: AssistantHistoryEntry[] = [];

/**
 * emitHistoryUpdated: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function emitHistoryUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HISTORY_UPDATED_EVENT));
}

/**
 * mapApiHistory: descrive il comportamento principale di questa funzione.
 * @param entries Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function mapApiHistory(entries: Array<{ id: string; command: string; response: string; route?: string; createdAt: string }>): AssistantHistoryEntry[] {
  return entries.map((item) => ({
    id: item.id,
    command: item.command,
    response: item.response,
    route: item.route,
    createdAt: new Date(item.createdAt).getTime()
  }));
}

/**
 * loadAssistantHistory: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function loadAssistantHistory(): AssistantHistoryEntry[] {
  return historyCache;
}

/**
 * syncAssistantHistory: descrive il comportamento principale di questa funzione.
 * @param limit Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function syncAssistantHistory(limit = 20): Promise<AssistantHistoryEntry[]> {
  try {
    const response = await getAssistantHistory({ limit, offset: 0 });
    historyCache = mapApiHistory(response.data);
    emitHistoryUpdated();
    return historyCache;
  } catch {
    return historyCache;
  }
}

/**
 * appendAssistantHistory: descrive il comportamento principale di questa funzione.
 * @param entry Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function appendAssistantHistory(entry: Omit<AssistantHistoryEntry, "id" | "createdAt">): Promise<void> {
  const optimistic: AssistantHistoryEntry = {
    ...entry,
    id: `hist-${Date.now()}`,
    createdAt: Date.now()
  };
  historyCache = [optimistic, ...historyCache].slice(0, 20);
  emitHistoryUpdated();

  try {
    await createAssistantHistory({
      command: entry.command,
      response: entry.response,
      route: entry.route
    });
    await syncAssistantHistory(20);
  } catch {
    // Keep optimistic cache if backend is temporarily unavailable.
  }
}
