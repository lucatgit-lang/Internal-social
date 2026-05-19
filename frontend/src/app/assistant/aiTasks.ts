/**
 * File Overview: aiTasks.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { createAssistantTask, getAssistantTasks, patchAssistantTask } from "../api/assistant";
import type { OperationalSnapshot } from "./types";

export type DashboardTaskPriority = "high" | "medium" | "low";
export type DashboardTaskStatus = "pending" | "in_progress" | "done";

export interface DashboardTaskItem {
  id: string;
  title: string;
  description: string;
  priority: DashboardTaskPriority;
  status: DashboardTaskStatus;
  dueDate: string;
  route: string;
  owner?: string;
  source?: "assistant";
}

export const TASKS_UPDATED_EVENT = "assistant:tasks-updated";

let tasksCache: DashboardTaskItem[] = [];

/**
 * emitTasksUpdated: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function emitTasksUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TASKS_UPDATED_EVENT));
}

/**
 * mapApiTasks: descrive il comportamento principale di questa funzione.
 * @param tasks Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function mapApiTasks(tasks: Array<Omit<DashboardTaskItem, "source"> & { source?: "assistant" }>): DashboardTaskItem[] {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    route: task.route,
    owner: task.owner,
    source: "assistant"
  }));
}

/**
 * loadAssistantTasks: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function loadAssistantTasks(): DashboardTaskItem[] {
  return tasksCache;
}

/**
 * syncAssistantTasks: descrive il comportamento principale di questa funzione.
 * @param limit Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function syncAssistantTasks(limit = 50): Promise<DashboardTaskItem[]> {
  try {
    const response = await getAssistantTasks({ limit, offset: 0 });
    tasksCache = mapApiTasks(response.data);
    emitTasksUpdated();
    return tasksCache;
  } catch {
    return tasksCache;
  }
}

/**
 * appendAssistantTasks: descrive il comportamento principale di questa funzione.
 * @param tasks Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function appendAssistantTasks(tasks: DashboardTaskItem[]): Promise<number> {
  if (!tasks.length) return 0;
  const current = tasksCache;
  const fingerprint = new Set(
    current.map((task) => `${task.title.toLowerCase()}|${task.route}|${task.dueDate.toLowerCase()}`)
  );

  const uniqueIncoming = tasks.filter((task) => {
    const key = `${task.title.toLowerCase()}|${task.route}|${task.dueDate.toLowerCase()}`;
    if (fingerprint.has(key)) return false;
    fingerprint.add(key);
    return true;
  });

  if (!uniqueIncoming.length) return 0;

  tasksCache = [...uniqueIncoming, ...current].slice(0, 50);
  emitTasksUpdated();

  let inserted = 0;
  for (const task of uniqueIncoming) {
    try {
      await createAssistantTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        route: task.route,
        owner: task.owner,
        source: "assistant"
      });
      inserted += 1;
    } catch {
      // continue
    }
  }

  await syncAssistantTasks(50);
  return inserted;
}

/**
 * markAssistantTasksDone: descrive il comportamento principale di questa funzione.
 * @param limit Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function markAssistantTasksDone(limit = 2): Promise<number> {
  const candidates = tasksCache.filter((task) => task.status !== "done").slice(0, limit);
  if (!candidates.length) return 0;
  let changed = 0;
  for (const task of candidates) {
    try {
      await patchAssistantTask(task.id, { status: "done" });
      changed += 1;
    } catch {
      // continue
    }
  }
  await syncAssistantTasks(50);
  return changed;
}

/**
 * markAssistantTasksInProgress: descrive il comportamento principale di questa funzione.
 * @param limit Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function markAssistantTasksInProgress(limit = 2): Promise<number> {
  const candidates = tasksCache.filter((task) => task.status === "pending").slice(0, limit);
  if (!candidates.length) return 0;
  let changed = 0;
  for (const task of candidates) {
    try {
      await patchAssistantTask(task.id, { status: "in_progress" });
      changed += 1;
    } catch {
      // continue
    }
  }
  await syncAssistantTasks(50);
  return changed;
}

/**
 * createFallbackAdviceTasks: descrive il comportamento principale di questa funzione.
 * @param snapshot Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function createFallbackAdviceTasks(snapshot: OperationalSnapshot): DashboardTaskItem[] {
  const now = Date.now();
  const tasks: DashboardTaskItem[] = [];

  if (snapshot.lateShipments > 0) {
    tasks.push({
      id: `ai-late-${now}`,
      title: "Sblocca spedizioni in ritardo",
      description: `Priorita alta: ${snapshot.lateShipments} spedizioni richiedono riallineamento oggi.`,
      priority: "high",
      status: "pending",
      dueDate: "Oggi",
      route: "/allestimento",
      owner: "Logistica",
      source: "assistant"
    });
  }

  if (snapshot.blockedOrders > 0) {
    tasks.push({
      id: `ai-blocked-${now + 1}`,
      title: "Sblocca ordini critici",
      description: `${snapshot.blockedOrders} ordini bloccati da risolvere prima delle nuove prese in carico.`,
      priority: "high",
      status: "pending",
      dueDate: "Oggi",
      route: "/ordini",
      owner: "Back Office",
      source: "assistant"
    });
  }

  if (snapshot.productionToStart > 0) {
    tasks.push({
      id: `ai-production-${now + 2}`,
      title: "Avvia lavorazioni prioritarie",
      description: `${snapshot.productionToStart} lavorazioni da avviare per ridurre impatto su consegne.`,
      priority: "medium",
      status: "pending",
      dueDate: "Oggi",
      route: "/produzione",
      owner: "Produzione",
      source: "assistant"
    });
  }

  if (tasks.length === 0) {
    tasks.push({
      id: `ai-maintain-${now + 3}`,
      title: "Monitoraggio operativo",
      description: "Nessuna criticita alta: mantieni controllo su urgenti e lead time spedizioni.",
      priority: "low",
      status: "pending",
      dueDate: "Oggi",
      route: "/",
      owner: "Operations",
      source: "assistant"
    });
  }

  return tasks.slice(0, 3);
}
