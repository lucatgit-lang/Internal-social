/**
 * File Overview: orders.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { apiGet, apiPost } from "./client";

export interface OrderListItem {
  id: string;
  externalDocId: string;
  dataDoc: string | null;
  situazioneOrdine: string | null;
  statoEvasione: string | null;
  livelloUrgenza: string | null;
  totaleV1: number | null;
  dataConsegna: string | null;
  customer: {
    id: string | null;
    ragioneSociale: string | null;
  };
}

interface OrderListResponse {
  data: OrderListItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface OrderDetailItem {
  id: string;
  externalDocRigaId: string;
  codArt: string | null;
  desArt: string | null;
  quantRiga: number | null;
  importoV1: number | null;
}

export interface OrderDetail {
  id: string;
  externalDocId: string;
  dataDoc: string | null;
  situazioneOrdine: string | null;
  statoEvasione: string | null;
  livelloUrgenza: string | null;
  totaleV1: number | null;
  dataConsegna: string | null;
  customer: {
    id: string | null;
    ragioneSociale: string | null;
  };
  items: OrderDetailItem[];
}

/**
 * getOrders: descrive il comportamento principale di questa funzione.
 * @param params Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */

export async function getOrders(params?: {
  limit?: number;
  offset?: number;
  statoEvasione?: string;
  livelloUrgenza?: string;
  search?: string;
}): Promise<OrderListResponse> {
  const query = new URLSearchParams();
  if (params?.limit != null) query.set("limit", String(params.limit));
  if (params?.offset != null) query.set("offset", String(params.offset));
  if (params?.statoEvasione) query.set("statoEvasione", params.statoEvasione);
  if (params?.livelloUrgenza) query.set("livelloUrgenza", params.livelloUrgenza);
  if (params?.search) query.set("search", params.search);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiGet<OrderListResponse>(`/api/v1/orders${suffix}`);
}

/**
 * getOrderById: descrive il comportamento principale di questa funzione.
 * @param id Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getOrderById(id: string): Promise<OrderDetail> {
  const response = await apiGet<{ data: OrderDetail }>(`/api/v1/orders/${encodeURIComponent(id)}`);
  return response.data;
}

export interface CreateOrderInputItem {
  productCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderInput {
  customerId: string;
  priority: "normale" | "alta" | "urgente";
  notes?: string;
  shippingService?: "SILVER" | "GOLD";
  shippingCost?: number;
  items: CreateOrderInputItem[];
}

export interface CreateOrderResult {
  id: string;
  externalDocId: string;
  customer: {
    id: string;
    ragioneSociale: string;
  };
  total: number;
  itemsCount: number;
}

/**
 * createOrder: descrive il comportamento principale di questa funzione.
 * @param payload Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function createOrder(payload: CreateOrderInput): Promise<CreateOrderResult> {
  const response = await apiPost<{ data: CreateOrderResult }>("/api/v1/orders", payload);
  return response.data;
}
