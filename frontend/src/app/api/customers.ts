/**
 * File Overview: customers.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { apiGet } from "./client";

export interface CustomerListItem {
  id: string;
  externalCode: string | null;
  ragioneSociale: string;
  partitaIva: string | null;
  codiceFiscale: string | null;
  comune: string | null;
  provincia: string | null;
  stato: string | null;
}

interface CustomerListResponse {
  data: CustomerListItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface CustomerDetail {
  id: string;
  externalCode: string | null;
  ragioneSociale: string;
  partitaIva: string | null;
  codiceFiscale: string | null;
  comune: string | null;
  provincia: string | null;
  stato: string | null;
  stats: {
    totalOrders: number;
    totalAmount: number;
  };
  orders: Array<{
    id: string;
    externalDocId: string;
    dataDoc: string | null;
    situazioneOrdine: string | null;
    statoEvasione: string | null;
    livelloUrgenza: string | null;
    totaleV1: number | null;
    dataConsegna: string | null;
    itemsCount: number;
    itemsQtyTotal: number;
    shipment: {
      id: string;
      status: string | null;
      plannedDate: string | null;
      deliveredAt: string | null;
    } | null;
    ddt: {
      id: string;
      numero: string | null;
      dataDoc: string | null;
      status: string | null;
    } | null;
  }>;
}

/**
 * getCustomers: descrive il comportamento principale di questa funzione.
 * @param params Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */

export async function getCustomers(params?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<CustomerListResponse> {
  const query = new URLSearchParams();
  if (params?.limit != null) query.set("limit", String(params.limit));
  if (params?.offset != null) query.set("offset", String(params.offset));
  if (params?.search) query.set("search", params.search);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiGet<CustomerListResponse>(`/api/v1/customers${suffix}`);
}

/**
 * getCustomerById: descrive il comportamento principale di questa funzione.
 * @param id Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getCustomerById(id: string): Promise<CustomerDetail> {
  const response = await apiGet<{ data: CustomerDetail }>(`/api/v1/customers/${encodeURIComponent(id)}`);
  return response.data;
}
