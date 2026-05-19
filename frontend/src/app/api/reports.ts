/**
 * File Overview: reports.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { apiGet } from "./client";

export type ReportPeriod = "day" | "week" | "month";
const REPORT_TIMEOUT_MS = 15000;

export interface OrdersReportResponse {
  period: ReportPeriod;
  source: string;
  summary: {
    totalOrders: number;
    completedOrders: number;
    blockedOrders: number;
    pendingOrders: number;
    totalValue: number;
  };
  series: Array<{
    label: string;
    orders: number;
    totalValue: number;
  }>;
  byStatus: Array<{
    name: string;
    value: number;
  }>;
}

/**
 * getOrdersReport: descrive il comportamento principale di questa funzione.
 * @param period Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getOrdersReport(period: ReportPeriod): Promise<OrdersReportResponse> {
  return apiGet<OrdersReportResponse>(`/api/v1/analytics/orders?period=${period}`, REPORT_TIMEOUT_MS);
}

export interface DdtReportResponse {
  period: ReportPeriod;
  source: string;
  summary: {
    total: number;
    delivered: number;
    inTransit: number;
  };
  series: Array<{
    label: string;
    value: number;
  }>;
  recent: Array<{
    id: string;
    numero: string | null;
    data: string | null;
    ordine: string | null;
    cliente: string | null;
    destinazione: string | null;
    stato: string | null;
  }>;
}

/**
 * getDdtReport: descrive il comportamento principale di questa funzione.
 * @param period Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getDdtReport(period: ReportPeriod): Promise<DdtReportResponse> {
  return apiGet<DdtReportResponse>(`/api/v1/analytics/ddt?period=${period}`, REPORT_TIMEOUT_MS);
}

export interface OperationsReportResponse {
  period: ReportPeriod;
  source: string;
  production: {
    pending: number;
    running: number;
    completed: number;
  };
  shipments: {
    total: number;
    late: number;
  };
  recentProductionJobs: Array<{
    id: string;
    ordine: string | null;
    cliente: string | null;
    stato: string;
    data: string | null;
  }>;
  recentShipments: Array<{
    id: string;
    ordine: string | null;
    cliente: string | null;
    stato: string;
    data: string | null;
  }>;
}

/**
 * getOperationsReport: descrive il comportamento principale di questa funzione.
 * @param period Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getOperationsReport(period: ReportPeriod): Promise<OperationsReportResponse> {
  return apiGet<OperationsReportResponse>(`/api/v1/analytics/operations?period=${period}`, REPORT_TIMEOUT_MS);
}

export interface OrdersDailyOverviewResponse {
  source: string;
  days: number;
  from: string;
  to: string;
  data: Array<{
    date: string;
    label: string;
    orders: number;
    clients: number;
    revenue: number;
  }>;
}

/**
 * getOrdersDailyOverview: descrive il comportamento principale di questa funzione.
 * @param days Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getOrdersDailyOverview(days = 30): Promise<OrdersDailyOverviewResponse> {
  return apiGet<OrdersDailyOverviewResponse>(
    `/api/v1/analytics/orders-daily?days=${encodeURIComponent(String(days))}`,
    REPORT_TIMEOUT_MS
  );
}

export interface PurchasesSummaryResponse {
  source: string;
  summary: {
    catalogEntries: number;
    catalogCostTotal: number;
    catalogCostAverage: number;
    finishedProducts: number;
  };
  processCostRule: {
    labor: number;
    transport: number;
    label: number;
  };
  rows: Array<{
    group: string;
    entries: number;
    totalCost: number;
    averageCost: number;
  }>;
  limitations: string[];
}

/**
 * getPurchasesSummary: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getPurchasesSummary(): Promise<PurchasesSummaryResponse> {
  return apiGet<PurchasesSummaryResponse>(`/api/v1/analytics/purchases-summary`, REPORT_TIMEOUT_MS);
}

export interface MaterialNeedsResponse {
  source: string;
  window: {
    from: string;
    to: string;
  };
  summary: {
    criticalMaterials: number;
    totalMaterials: number;
    totalEstimatedValue: number;
    activeOrders: number;
  };
  rows: Array<{
    code: string;
    name: string;
    requestedQty: number;
    estimatedValue: number;
    ordersCount: number;
    urgency: "alta" | "media" | "bassa";
  }>;
}

/**
 * getMaterialNeeds: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getMaterialNeeds(): Promise<MaterialNeedsResponse> {
  return apiGet<MaterialNeedsResponse>(`/api/v1/analytics/material-needs`, REPORT_TIMEOUT_MS);
}
