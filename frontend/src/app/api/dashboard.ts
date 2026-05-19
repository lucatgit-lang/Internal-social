/**
 * File Overview: dashboard.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import type { OperationalSnapshot } from "../assistant/types";
import { apiGet } from "./client";
const DASHBOARD_TIMEOUT_MS = 15000;

interface DashboardPriorityResponse extends OperationalSnapshot {
  source?: string;
}

/**
 * getDashboardPrioritySnapshot: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getDashboardPrioritySnapshot(): Promise<DashboardPriorityResponse> {
  return apiGet<DashboardPriorityResponse>("/api/v1/dashboard/priority", DASHBOARD_TIMEOUT_MS);
}

export interface DashboardSummaryResponse {
  openOrders: number;
  queuedProduction: number;
  pendingShipments: number;
  totalCustomers: number;
  totalProducts: number;
  source?: string;
}

/**
 * getDashboardSummary: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  return apiGet<DashboardSummaryResponse>("/api/v1/dashboard/summary", DASHBOARD_TIMEOUT_MS);
}
