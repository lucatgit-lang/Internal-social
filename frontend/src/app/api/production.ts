/**
 * File Overview: production.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { apiGet, apiPatch } from "./client";

export interface ProductionJob {
  id: string;
  status: string;
  priority: string;
  scheduledDate: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  orderExternalDocId: string | null;
  customerName: string | null;
}

export interface ProductionJobDetailResponse {
  data: {
    id: string;
    status: string;
    priority: string;
    scheduledDate: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    order: {
      id: string | null;
      externalDocId: string | null;
      dataDoc: string | null;
      situazioneOrdine: string | null;
      statoEvasione: string | null;
      livelloUrgenza: string | null;
      dataConsegna: string | null;
      totaleV1: number | null;
      customerName: string | null;
      customerCity: string | null;
    };
    items: Array<{
      id: string;
      code: string | null;
      description: string | null;
      quantity: number | null;
      totalValue: number | null;
    }>;
  };
}

export interface ProductionJobsResponse {
  data: ProductionJob[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * getProductionJobs: descrive il comportamento principale di questa funzione.
 * @param params Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */

export async function getProductionJobs(params?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<ProductionJobsResponse> {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.offset != null) search.set("offset", String(params.offset));
  if (params?.status) search.set("status", params.status);

  const query = search.toString();
  return apiGet<ProductionJobsResponse>(`/api/v1/production/jobs${query ? `?${query}` : ""}`);
}

/**
 * getProductionJobById: descrive il comportamento principale di questa funzione.
 * @param id Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getProductionJobById(id: string): Promise<ProductionJobDetailResponse> {
  return apiGet<ProductionJobDetailResponse>(`/api/v1/production/jobs/${id}`);
}

/**
 * updateProductionJobStatus: descrive il comportamento principale di questa funzione.
 * @param id Input richiesto dalla funzione.
 * @param status Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function updateProductionJobStatus(id: string, status: string): Promise<{ data: { id: string; status: string } }> {
  return apiPatch<{ data: { id: string; status: string } }>(`/api/v1/production/jobs/${id}/status`, {
    status
  });
}
